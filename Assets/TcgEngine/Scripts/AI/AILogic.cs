﻿using System.Collections;
using System.Collections.Generic;
using System.Threading;
using System.Linq;
using UnityEngine;
using UnityEngine.Profiling;
using TcgEngine.Gameplay;

namespace TcgEngine.AI
{
    /// <summary>
    /// Minimax algorithm for AI. 
    /// </summary>

    public class AILogic
    {
        //-------- AI Logic Params ------------------

        public int ai_depth = 3;                //How many turns in advance does it check, higher number takes exponentially longer
        public int ai_depth_wide = 1;           //For these first few turns, will consider more options, slow!
        public int actions_per_turn = 2;          //AI wont predict more than this number of sequential actions per turn, if more than that will EndTurn (Do A, then do B, then do C, then end turn)
        public int actions_per_turn_wide = 3;     //Same but in wide depth
        public int nodes_per_action = 4;         //For a turn action (1st, 2nd, or 3rd...), cannot evaluate more than this number of child nodes, if more, will only process the AIActions with with best score
        public int nodes_per_action_wide = 7;    //Same but in wide depth

        //Example: for the first turn, AI will predict 3 sequential actions (I play a card, then attack with this one, then play a spell),
        //for each of those actions, it will look at 7 possibilities, if more will cut based on score, keeping the actions with highest score
        //At depth 2 and 3 it will only try to perform 2 actions but for each one will evaluate 4 possibilities. Depth 2 is the opponent's turn and depth 3 is the AI's next turn.
        //For the nodes that are evaluated, will go down to depth 3 and calculate heuristic at the max depth, and then propagate the heuristic up in the node tree.
        //AI will choose the move that has a path leading to the best heuristic.

        //-----

        public int ai_player_id;                    //AI player_id  (usually its 1)
        public int ai_level = 10;                   //AI level

        private GameLogic game_logic;           //Game logic used to calculate moves
        private Game original_data;             //Original game data when start calculating possibilities
        private AIHeuristic heuristic;
        private Thread ai_thread;

        private NodeState first_node = null;
        private NodeState best_move = null;

        private bool running = false;
        private int nb_calculated = 0;
        private int reached_depth = 0;

        private System.Random random_gen;

        private Pool<NodeState> node_pool = new Pool<NodeState>();
        private Pool<Game> data_pool = new Pool<Game>();
        private Pool<AIAction> action_pool = new Pool<AIAction>();
        private Pool<List<AIAction>> list_pool = new Pool<List<AIAction>>();
        private ListSwap<Card> card_array = new ListSwap<Card>();
        private ListSwap<Slot> slot_array = new ListSwap<Slot>();

        public static AILogic Create(int player_id, int level)
        {
            AILogic job = new AILogic();
            job.ai_player_id = player_id;
            job.ai_level = level;

            job.heuristic = new AIHeuristic(player_id, level);
            job.game_logic = new GameLogic(true); //Skip all delays for the AI calculations

            return job;
        }

        public void RunAI(Game data)
        {
            if (running)
                return;

            original_data = Game.CloneNew(data);        //Clone game data to keep original data unaffected
            game_logic.ClearResolve();                 //Clear temp memory
            game_logic.SetData(original_data);          //Assign data to game logic
            random_gen = new System.Random();       //Reset random seed

            first_node = null;
            reached_depth = 0;
            nb_calculated = 0;

            Start();

        }

        public void Start()
        {
            running = true;

            //Uncomment these lines to run on separate thread (and comment Execute()), better for production so it doesn't freeze the UI while calculating the AI
            ai_thread = new Thread(Execute);
            ai_thread.Start();

            //Uncomment this line to run on main thread (and comment the thread one), better for debuging since you will be able to use breakpoints, profiler and Debug.Log
            //Execute();
        }

        public void Stop()
        {
            running = false;
            if (ai_thread != null && ai_thread.IsAlive)
                ai_thread.Abort();
        }

        public void Execute()
        {
            //Create first node
            first_node = CreateNode(null, null, ai_player_id, 0, 0);
            first_node.hvalue = heuristic.CalculateHeuristic(original_data, first_node);
            first_node.alpha = int.MinValue;
            first_node.beta = int.MaxValue;

            Profiler.BeginSample("AI");
            System.Diagnostics.Stopwatch watch = System.Diagnostics.Stopwatch.StartNew();

            //Calculate first node
            CalculateNode(original_data, first_node);

            Debug.Log("AI: Time " + watch.ElapsedMilliseconds + "ms Depth " + reached_depth + " Nodes " + nb_calculated);
            Profiler.EndSample();

            //Save best move
            best_move = first_node.best_child;
            running = false;
        }

        public IEnumerator getTilesToBurn(Game data)
        {
            List<Slot> allSlots = Slot.GetAll();
            List<Slot> slotsWithFire = new List<Slot>();
            List<Slot> validSlots = new List<Slot>();
            List<int> slotsToBurn = new List<int>();
            List<int> slotsWithFireFighters = new List<int>();
            List<int> protectedSlots = new List<int>();
            List<FireSpreadItemRequestPayload> spreadPayloads = new List<FireSpreadItemRequestPayload>();
            string[] potentialSlotsToBurn;

            foreach (Slot slot in allSlots)
            {
                Card cardOnSlot = data.GetSlotCard(slot);
                string id = "none";
                if (cardOnSlot != null) id = cardOnSlot.card_id;
                if (cardOnSlot == null && slot.health > 0)
                {
                    validSlots.Add(slot);
                }
                else if (id == "forest_fire")
                {
                    slotsWithFire.Add(slot);
                    spreadPayloads.Add(new FireSpreadItemRequestPayload(slot.x, Utilities.getSeverity()));
                }
                else if (id == "dale_hudson")
                {
                    slotsWithFireFighters.Add(slot.x);
                }
            }

            foreach (int slot in slotsWithFireFighters)
            {
                int[] adjacentCoordinates = Utilities.getAdjacentCoordinates(slot);
                foreach (int coordinate in adjacentCoordinates)
                {
                    protectedSlots.Add(coordinate);
                }

                spreadPayloads.Add(new FireSpreadItemRequestPayload(slot, "low"));
            }

            int windDirectionIndex = Random.Range(0, 4);
            IEnumerator fireSpreadCoroutine = AIFetcher.fetchFireSpreadCoordinates(spreadPayloads);
            yield return fireSpreadCoroutine;
            potentialSlotsToBurn = (string[])fireSpreadCoroutine.Current;


            foreach (string slotString in potentialSlotsToBurn)
            {

                int slotToBurn = int.Parse(slotString);
                bool notProtected = !protectedSlots.Any(slot => slot == slotToBurn);
                bool slotToBurnIsValid = validSlots.Any(slot => slot.x == slotToBurn) && !slotsToBurn.Any(slot => slot == slotToBurn) && slotToBurn > 0 && notProtected && slotToBurn < 45;
                if (slotToBurnIsValid)
                {
                    slotsToBurn.Add(slotToBurn);
                }
            }

            yield return slotsToBurn;
        }

        private int[] temporaryFireSpreadAI(int center)
        {
            int[][] spreadOptions = new int[][]
            {
                /* new int[] {north, south, east, west} */
                new int[] {0, 5, 2, 0}, // coordinate 1
                new int[] {0, 6, 3, 1}, // coordinate 2
                new int[] {0, 7, 4, 2}, // coordinate 3
                new int[] {0, 8, 0, 3}, // coordinate 4
                new int[] {1, 9, 6, 0}, // coordinate 5
                new int[] {2, 10, 7, 5}, // coordinate 6
                new int[] {3, 11, 8, 6}, // coordinate 7
                new int[] {4, 12, 0, 7}, // coordinate 8
                new int[] {5, 13, 10, 0}, // coordinate 9
                new int[] {6, 14, 11, 9}, // coordinate 10
                new int[] {7, 15, 12, 10}, // coordinate 11
                new int[] {8, 10, 0, 11}, // coordinate 12
                new int[] {9, 0, 14, 0}, // coordinate 13
                new int[] {10, 18, 15, 13}, // coordinate 14
                new int[] {11, 19, 10, 14}, // coordinate 15
                new int[] {12, 20, 17, 15}, // coordinate 16
                new int[] {0, 26, 0, 16}, // coordinate 17
                new int[] {14, 23, 19, 0}, // coordinate 18
                new int[] {15, 24, 20, 18}, // coordinate 19
                new int[] {16, 25, 21, 19}, // coordinate 20
                new int[] {17, 26, 22, 20}, // coordinate 21
                new int[] {0, 27, 0, 21}, // coordinate 22
                new int[] {18, 0, 24, 0}, // coordinate 23
                new int[] {19, 29, 25, 23}, // coordinate 24
                new int[] {20, 30, 26, 24}, // coordinate 25
                new int[] {21, 31, 27, 25}, // coordinate 26
                new int[] {22, 32, 28, 26}, // coordinate 27
                new int[] {0, 33, 0, 27}, // coordinate 28
                new int[] {24, 35, 30, 0}, // coordinate 29
                new int[] {25, 36, 31, 29}, // coordinate 30
                new int[] {26, 37, 32, 30}, // coordinate 31
                new int[] {27, 38, 33, 31}, // coordinate 32
                new int[] {28, 39, 34, 32}, // coordinate 33
                new int[] {0, 40, 0, 33}, // coordinate 34
                new int[] {29, 0, 36, 0}, // coordinate 35
                new int[] {30, 0, 37, 35}, // coordinate 36
                new int[] {31, 41, 38, 36}, // coordinate 37
                new int[] {32, 42, 39, 37}, // coordinate 38
                new int[] {33, 43, 40, 38}, // coordinate 39
                new int[] {34, 44, 0, 39}, // coordinate 40
                new int[] {37, 0, 42, 0}, // coordinate 41
                new int[] {38, 0, 43, 41}, // coordinate 42
                new int[] {39, 0, 44, 42}, // coordinate 43
                new int[] {40, 0, 0, 43}  // coordinate 44
            };

            return spreadOptions[center - 1];
        }



        //Add list of all possible orders and search in all of them
        private void CalculateNode(Game data, NodeState node)
        {
            Profiler.BeginSample("Add Actions");
            Player player = data.GetPlayer(data.current_player);
            List<AIAction> action_list = list_pool.Create();

            int max_actions = node.tdepth < ai_depth_wide ? actions_per_turn_wide : actions_per_turn;
            if (node.taction < max_actions)
            {
                if (data.selector == SelectorType.None)
                {

                    //Play card
                    if (player.is_ai && player.cards_hand.Count > 0)
                    {
                        Card card = player.cards_hand[0];
                        AddActions(action_list, data, node, GameAction.PlayCard, card);
                    }
                    else
                    {
                        for (int c = 0; c < player.cards_hand.Count; c++)
                        {
                            Card card = player.cards_hand[c];
                            AddActions(action_list, data, node, GameAction.PlayCard, card);
                        }
                    }


                    //Action on board
                    for (int c = 0; c < player.cards_board.Count; c++)
                    {
                        Card card = player.cards_board[c];
                        AddActions(action_list, data, node, GameAction.Attack, card);
                        AddActions(action_list, data, node, GameAction.AttackPlayer, card);
                        AddActions(action_list, data, node, GameAction.CastAbility, card);
                        //AddActions(action_list, data, node, GameAction.Move, card);        //Uncomment to consider move actions
                    }

                    if (player.hero != null)
                        AddActions(action_list, data, node, GameAction.CastAbility, player.hero);
                }
                else
                {
                    AddSelectActions(action_list, data, node);
                }
            }

            //End Turn (dont add action if ai can still attack player, or ai hasnt spent any mana)
            bool is_full_mana = HasAction(action_list, GameAction.PlayCard) && player.mana >= player.mana_max;
            bool can_attack_player = HasAction(action_list, GameAction.AttackPlayer);
            bool can_end = !can_attack_player && !is_full_mana && data.selector == SelectorType.None;
            if (action_list.Count == 0 || can_end)
            {
                AIAction actiont = CreateAction(GameAction.EndTurn);
                action_list.Add(actiont);
            }

            //Remove actions with low score
            FilterActions(data, node, action_list);
            Profiler.EndSample();

            //Execute valid action and search child node
            for (int o = 0; o < action_list.Count; o++)
            {
                AIAction action = action_list[o];
                if (action.valid && node.alpha < node.beta)
                {
                    CalculateChildNode(data, node, action);
                }
            }

            action_list.Clear();
            list_pool.Dispose(action_list);
        }

        //Mark valid/invalid on each action, if too many actions, will keep only the ones with best score
        private void FilterActions(Game data, NodeState node, List<AIAction> action_list)
        {
            int count_valid = 0;
            for (int o = 0; o < action_list.Count; o++)
            {
                AIAction action = action_list[o];
                action.sort = heuristic.CalculateActionSort(data, action);
                action.valid = action.sort <= 0 || action.sort >= node.sort_min;
                if (action.valid)
                    count_valid++;
            }

            int max_actions = node.tdepth < ai_depth_wide ? nodes_per_action_wide : nodes_per_action;
            int max_actions_skip = max_actions + 2; //No need to calculate all scores if its just to remove 1-2 actions
            if (count_valid <= max_actions_skip)
                return; //No filtering needed

            //Calculate scores
            for (int o = 0; o < action_list.Count; o++)
            {
                AIAction action = action_list[o];
                if (action.valid)
                {
                    action.score = heuristic.CalculateActionScore(data, action);
                }
            }

            //Sort, and invalidate actions with low score
            action_list.Sort((AIAction a, AIAction b) => { return b.score.CompareTo(a.score); });
            for (int o = 0; o < action_list.Count; o++)
            {
                AIAction action = action_list[o];
                action.valid = action.valid && o < max_actions;
            }
        }

        //Create a child node for parent, and calculate it
        private void CalculateChildNode(Game data, NodeState parent, AIAction action)
        {
            if (action.type == GameAction.None)
                return;

            int player_id = data.current_player;

            //Clone data so we can update it in a new node
            Profiler.BeginSample("Clone Data");
            Game ndata = data_pool.Create();
            Game.Clone(data, ndata); //Clone
            game_logic.ClearResolve();
            game_logic.SetData(ndata);
            Profiler.EndSample();

            //Execute move and update data
            Profiler.BeginSample("Execute AIAction");
            DoAIAction(ndata, action, player_id);
            Profiler.EndSample();

            //Update depth
            bool new_turn = action.type == GameAction.EndTurn;
            int next_tdepth = parent.tdepth;
            int next_taction = parent.taction + 1;

            if (new_turn)
            {
                next_tdepth = parent.tdepth + 1;
                next_taction = 0;
            }

            //Create node
            Profiler.BeginSample("Create Node");
            NodeState child_node = CreateNode(parent, action, player_id, next_tdepth, next_taction);
            parent.childs.Add(child_node);
            Profiler.EndSample();

            //Set minimum sort for next AIActions, if new turn, reset to 0
            child_node.sort_min = new_turn ? 0 : Mathf.Max(action.sort, child_node.sort_min);

            //If win or reached max depth, stop searching deeper
            if (!ndata.HasEnded() && child_node.tdepth < ai_depth)
            {
                //Calculate child
                CalculateNode(ndata, child_node);
            }
            else
            {
                //End of tree, calculate full Heuristic
                child_node.hvalue = heuristic.CalculateHeuristic(ndata, child_node);
            }

            //Update parents hvalue, alpha, beta, and best child
            if (player_id == ai_player_id)
            {
                //AI player
                if (parent.best_child == null || child_node.hvalue > parent.hvalue)
                {
                    parent.best_child = child_node;
                    parent.hvalue = child_node.hvalue;
                    parent.alpha = Mathf.Max(parent.alpha, parent.hvalue);
                }
            }
            else
            {
                //Opponent player
                if (parent.best_child == null || child_node.hvalue < parent.hvalue)
                {
                    parent.best_child = child_node;
                    parent.hvalue = child_node.hvalue;
                    parent.beta = Mathf.Min(parent.beta, parent.hvalue);
                }
            }

            //Just for debug, keep track of node/depth count
            nb_calculated++;
            if (child_node.tdepth > reached_depth)
                reached_depth = child_node.tdepth;

            //We are done with this game data, dispose it.
            //Dont dispose NodeState here (node_pool) since we want to retrieve the full tree path later
            data_pool.Dispose(ndata);
        }

        private NodeState CreateNode(NodeState parent, AIAction action, int player_id, int turn_depth, int turn_action)
        {
            NodeState nnode = node_pool.Create();
            nnode.current_player = player_id;
            nnode.tdepth = turn_depth;
            nnode.taction = turn_action;
            nnode.parent = parent;
            nnode.last_action = action;
            nnode.alpha = parent != null ? parent.alpha : int.MinValue;
            nnode.beta = parent != null ? parent.beta : int.MaxValue;
            nnode.hvalue = 0;
            nnode.sort_min = 0;
            return nnode;
        }

        //Add all possible moves for card to list of actions
        private void AddActions(List<AIAction> actions, Game data, NodeState node, ushort type, Card card)
        {
            Player player = data.GetPlayer(data.current_player);

            if (data.selector != SelectorType.None)
                return;

            if (card.HasStatus(StatusType.Paralysed))
                return;

            if (type == GameAction.PlayCard)
            {
                if (card.CardData.IsBoardCard())
                {
                    //Doesn't matter where the card is played
                    Slot slot = player.GetRandomEmptySlot(random_gen, slot_array.Get());

                    if (data.CanPlayCard(card, slot))
                    {
                        AIAction action = CreateAction(type, card);
                        action.slot = slot;
                        actions.Add(action);
                    }
                }
                else if (card.CardData.IsEquipment())
                {
                    Player tplayer = data.GetPlayer(card.player_id);
                    for (int c = 0; c < tplayer.cards_board.Count; c++)
                    {
                        Card tcard = tplayer.cards_board[c];
                        if (data.CanPlayCard(card, tcard.slot))
                        {
                            AIAction action = CreateAction(type, card);
                            action.slot = tcard.slot;
                            action.target_player_id = tplayer.player_id;
                            actions.Add(action);
                        }
                    }
                }
                else if (card.CardData.IsRequireTargetSpell())
                {
                    for (int p = 0; p < data.players.Length; p++)
                    {
                        Player tplayer = data.players[p];
                        Slot tslot = new Slot(tplayer.player_id);
                        if (data.CanPlayCard(card, tslot))
                        {
                            AIAction action = CreateAction(type, card);
                            action.slot = tslot;
                            action.target_player_id = tplayer.player_id;
                            actions.Add(action);
                        }
                    }
                    foreach (Slot slot in Slot.GetAll())
                    {
                        bool isAI = data.GetPlayer(data.current_player).is_ai;
                        if (data.CanPlayCard(card, slot, false, isAI))
                        {
                            // Come back here
                            Card slot_card = data.GetSlotCard(slot);

                            AIAction action = CreateAction(type, card);
                            action.slot = slot;
                            action.target_uid = slot_card != null ? slot_card.uid : null;
                            actions.Add(action);
                        }
                    }
                }
                else if (data.CanPlayCard(card, Slot.None))
                {
                    AIAction action = CreateAction(type, card);
                    actions.Add(action);
                }
            }

            if (type == GameAction.Attack)
            {
                if (card.CanAttack())
                {
                    for (int p = 0; p < data.players.Length; p++)
                    {
                        if (p != player.player_id)
                        {
                            Player oplayer = data.players[p];
                            for (int tc = 0; tc < oplayer.cards_board.Count; tc++)
                            {
                                Card target = oplayer.cards_board[tc];
                                if (data.CanAttackTarget(card, target))
                                {
                                    AIAction action = CreateAction(type, card);
                                    action.target_uid = target.uid;
                                    actions.Add(action);
                                }
                            }
                        }
                    }
                }
            }

            if (type == GameAction.AttackPlayer)
            {
                if (card.CanAttack())
                {
                    for (int p = 0; p < data.players.Length; p++)
                    {
                        if (p != player.player_id)
                        {
                            Player oplayer = data.players[p];
                            if (data.CanAttackTarget(card, oplayer))
                            {
                                AIAction action = CreateAction(type, card);
                                action.target_player_id = oplayer.player_id;
                                actions.Add(action);
                            }
                        }
                    }
                }
            }

            if (type == GameAction.CastAbility)
            {
                List<AbilityData> abilities = card.GetAbilities();
                for (int a = 0; a < abilities.Count; a++)
                {
                    AbilityData ability = abilities[a];
                    if (ability.trigger == AbilityTrigger.Activate && data.CanCastAbility(card, ability) && ability.HasValidSelectTarget(data, card))
                    {
                        AIAction action = CreateAction(type, card);
                        action.ability_id = ability.id;
                        actions.Add(action);
                    }
                }
            }

            if (type == GameAction.Move)
            {
                foreach (Slot slot in Slot.GetAll(player.player_id))
                {
                    if (data.CanMoveCard(card, slot))
                    {
                        AIAction action = CreateAction(type, card);
                        action.slot = slot;
                        actions.Add(action);
                    }
                }
            }
        }

        //Add all possible moves for a selection
        private void AddSelectActions(List<AIAction> actions, Game data, NodeState node)
        {
            if (data.selector == SelectorType.None)
                return;

            Player player = data.GetPlayer(data.selector_player_id);
            Card caster = data.GetCard(data.selector_caster_uid);
            AbilityData ability = AbilityData.Get(data.selector_ability_id);
            if (player == null || caster == null || ability == null)
                return;

            if (ability.target == AbilityTarget.SelectTarget)
            {
                for (int p = 0; p < data.players.Length; p++)
                {
                    Player tplayer = data.players[p];
                    if (ability.CanTarget(data, caster, tplayer))
                    {
                        AIAction action = CreateAction(GameAction.SelectPlayer, caster);
                        action.target_player_id = tplayer.player_id;
                        actions.Add(action);
                    }

                    foreach (Slot slot in Slot.GetAll())
                    {
                        Card tcard = data.GetSlotCard(slot);
                        if (tcard != null && ability.CanTarget(data, caster, tcard))
                        {
                            AIAction action = CreateAction(GameAction.SelectCard, caster);
                            action.target_uid = tcard.uid;
                            actions.Add(action);
                        }
                        else if (tcard == null && ability.CanTarget(data, caster, slot))
                        {
                            AIAction action = CreateAction(GameAction.SelectSlot, caster);
                            action.slot = slot;
                            actions.Add(action);
                        }
                    }
                }
            }

            if (ability.target == AbilityTarget.CardSelector)
            {
                for (int p = 0; p < data.players.Length; p++)
                {
                    List<Card> cards = ability.GetCardTargets(data, caster, card_array);
                    foreach (Card tcard in cards)
                    {
                        AIAction action = CreateAction(GameAction.SelectCard, caster);
                        action.target_uid = tcard.uid;
                        actions.Add(action);
                    }
                }
            }

            if (ability.target == AbilityTarget.ChoiceSelector)
            {
                for (int i = 0; i < ability.chain_abilities.Length; i++)
                {
                    AbilityData choice = ability.chain_abilities[i];
                    if (choice != null && data.CanSelectAbility(caster, choice))
                    {
                        AIAction action = CreateAction(GameAction.SelectChoice, caster);
                        action.value = i;
                        actions.Add(action);
                    }
                }
            }

            //Add option to cancel, if no valid options
            if (actions.Count == 0)
            {
                AIAction caction = CreateAction(GameAction.CancelSelect, caster);
                actions.Add(caction);
            }
        }

        private AIAction CreateAction(ushort type)
        {
            AIAction action = action_pool.Create();
            action.Clear();
            action.type = type;
            action.valid = true;
            return action;
        }

        private AIAction CreateAction(ushort type, Card card)
        {
            AIAction action = action_pool.Create();
            action.Clear();
            action.type = type;
            action.card_uid = card.uid;
            action.valid = true;
            return action;
        }

        //Simulate AI action
        private void DoAIAction(Game data, AIAction action, int player_id)
        {
            Player player = data.GetPlayer(player_id);

            if (action.type == GameAction.PlayCard)
            {
                Card card = player.GetHandCard(action.card_uid);
                game_logic.PlayCard(card, action.slot);
            }

            if (action.type == GameAction.Move)
            {
                Card card = player.GetBoardCard(action.card_uid);
                game_logic.MoveCard(card, action.slot);
            }

            if (action.type == GameAction.Attack)
            {
                Card card = player.GetBoardCard(action.card_uid);
                Card target = data.GetBoardCard(action.target_uid);
                game_logic.AttackTarget(card, target);
            }

            if (action.type == GameAction.AttackPlayer)
            {
                Card card = player.GetBoardCard(action.card_uid);
                Player tplayer = data.GetPlayer(action.target_player_id);
                game_logic.AttackPlayer(card, tplayer);
            }

            if (action.type == GameAction.CastAbility)
            {
                Card card = player.GetCard(action.card_uid);
                AbilityData ability = AbilityData.Get(action.ability_id);
                game_logic.CastAbility(card, ability);
            }

            if (action.type == GameAction.SelectCard)
            {
                Card target = data.GetCard(action.target_uid);
                game_logic.SelectCard(target);
            }

            if (action.type == GameAction.SelectPlayer)
            {
                Player target = data.GetPlayer(action.target_player_id);
                game_logic.SelectPlayer(target);
            }

            if (action.type == GameAction.SelectSlot)
            {
                game_logic.SelectSlot(action.slot);
            }

            if (action.type == GameAction.SelectChoice)
            {
                game_logic.SelectChoice(action.value);
            }

            if (action.type == GameAction.CancelSelect)
            {
                game_logic.CancelSelection();
            }

            if (action.type == GameAction.EndTurn)
            {
                game_logic.EndTurn();
            }
        }

        private bool HasAction(List<AIAction> list, ushort type)
        {
            for (int i = 0; i < list.Count; i++)
            {
                if (list[i].type == type)
                    return true;
            }
            return false;
        }

        //----Return values----

        public bool IsRunning()
        {
            return running;
        }

        public string GetNodePath()
        {
            return GetNodePath(first_node);
        }

        public string GetNodePath(NodeState node)
        {
            string path = "Prediction: HValue: " + node.hvalue + "\n";
            NodeState current = node;
            AIAction move;

            while (current != null)
            {
                move = current.last_action;
                if (move != null)
                    path += "Player " + current.current_player + ": " + move.GetText(original_data) + "\n";
                current = current.best_child;
            }
            return path;
        }

        public void ClearMemory()
        {
            original_data = null;
            first_node = null;
            best_move = null;

            foreach (NodeState node in node_pool.GetAllActive())
                node.Clear();
            foreach (AIAction order in action_pool.GetAllActive())
                order.Clear();

            data_pool.DisposeAll();
            node_pool.DisposeAll();
            action_pool.DisposeAll();
            list_pool.DisposeAll();

            System.GC.Collect(); //Free memory from AI
        }

        public int GetNbNodesCalculated()
        {
            return nb_calculated;
        }

        public int GetDepthReached()
        {
            return reached_depth;
        }

        public NodeState GetBest()
        {
            return best_move;
        }

        public NodeState GetFirst()
        {
            return first_node;
        }

        public AIAction GetBestAction()
        {
            return best_move != null ? best_move.last_action : null;
        }

        public bool IsBestFound()
        {
            return best_move != null;
        }
    }

    public class NodeState
    {
        public int tdepth;      //Depth in number of turns
        public int taction;     //How many orders in current turn
        public int sort_min;    //Sorting minimum value, orders below this value will be ignored to avoid calculate both path A -> B and path B -> A
        public int hvalue;      //Heuristic value, this AI tries to maximize it, opponent tries to minimize it
        public int alpha;       //Highest heuristic reached by the AI player, used for optimization and ignore some tree branch
        public int beta;        //Lowest heuristic reached by the opponent player, used for optimization and ignore some tree branch

        public AIAction last_action = null;
        public int current_player;

        public NodeState parent;
        public NodeState best_child = null;
        public List<NodeState> childs = new List<NodeState>();

        public NodeState() { }

        public NodeState(NodeState parent, int player_id, int turn_depth, int turn_action, int turn_sort)
        {
            this.parent = parent;
            this.current_player = player_id;
            this.tdepth = turn_depth;
            this.taction = turn_action;
            this.sort_min = turn_sort;
        }

        public void Clear()
        {
            last_action = null;
            best_child = null;
            parent = null;
            childs.Clear();
        }
    }

    public class AIAction
    {
        public ushort type;

        public string card_uid;
        public string target_uid;
        public int target_player_id;
        public string ability_id;
        public Slot slot;
        public int value;

        public int score;           //Score to determine which orders get cut and ignored
        public int sort;            //Orders must be executed in sort order
        public bool valid;          //If false, this order will be ignored

        public AIAction() { }
        public AIAction(ushort t) { type = t; }

        public string GetText(Game data)
        {
            string txt = GameAction.GetString(type);
            Card card = data.GetCard(card_uid);
            Card target = data.GetCard(target_uid);
            if (card != null)
                txt += " card " + card.card_id;
            if (target != null)
                txt += " target " + target.card_id;
            if (slot != Slot.None)
                txt += " slot " + slot.x + "-" + slot.p;
            if (ability_id != null)
                txt += " ability " + ability_id;
            if (value > 0)
                txt += " value " + value;
            return txt;
        }

        public void Clear()
        {
            type = 0;
            valid = false;
            card_uid = null;
            target_uid = null;
            ability_id = null;
            target_player_id = -1;
            slot = Slot.None;
            value = -1;
            score = 0;
            sort = 0;
        }

        public static AIAction None { get { AIAction a = new AIAction(); a.type = 0; return a; } }
    }
}
