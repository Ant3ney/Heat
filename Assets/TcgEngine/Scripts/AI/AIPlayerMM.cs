using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using TcgEngine.Gameplay;

namespace TcgEngine.AI
{
    /// <summary>
    /// AI player using the MinMax AI algorithm
    /// </summary>

    public class AIPlayerMM : AIPlayer
    {
        private AILogic ai_logic;
        private System.Random rand = new System.Random();
        private bool is_playing = false;

        public AIPlayerMM(GameLogic gameplay, int id, int level)
        {
            this.gameplay = gameplay;
            player_id = id;
            ai_level = Mathf.Clamp(level, 1, 10);
            ai_logic = AILogic.Create(id, ai_level);
        }

        public override void Update()
        {
            Game game_data = gameplay.GetGameData();
            Player player = game_data.GetPlayer(player_id);

            if (!is_playing && CanPlay())
            {
                is_playing = true;
                Debug.Log("Ran AI turn");
                TimeTool.StartCoroutine(AiTurn());
            }

            if (!game_data.IsPlayerTurn(player) && ai_logic.IsRunning())
                Stop();
        }

        private IEnumerator AiTurn()
        {
            List<AIAction> aiActions = new List<AIAction>();
            Game game_data = gameplay.GetGameData();
            Player player = game_data.GetPlayer(game_data.current_player);

            // Initial turns
            if (game_data.turn_count == 0 || game_data.turn_count == 1)
            {
                string card_hand_id = player.cards_hand[0].uid;
                aiActions.Add(new AIAction());
                aiActions.Add(new AIAction());

                aiActions[0].type = GameAction.PlayCard;
                aiActions[0].card_uid = card_hand_id;

                int randomStartingPoint = getRandomValidSlotForFire(game_data, true);
                //List<int> burnSlots = new List<int>();
                aiActions[0].slot = new Slot(randomStartingPoint, 1, 0);
                aiActions[1].type = GameAction.EndTurn;
            }

            // Subsequent turns
            else
            {
                // Determine if we should spawn a random fire on board called season fire
                bool spawnedSeasonFire = false;
                if (game_data.startSeasonFire())
                {
                    aiActions.Add(new AIAction());
                    aiActions[0].type = GameAction.PlayCard;
                    aiActions[0].slot = new Slot(getRandomValidSlotForFire(game_data), 1, 0);
                    spawnedSeasonFire = true;
                }
                // Get all tiles to burn
                // Calls Async code in synchronous way
                List<int> slotsToBurn = (List<int>)ai_logic.getTilesToBurn(game_data);

                foreach (int slot in slotsToBurn)
                {
                    Debug.Log("Burn: " + slot);
                }

                int actionIndex = spawnedSeasonFire ? 1 : 0;
                foreach (var slotCordinate in slotsToBurn)
                {
                    aiActions.Add(new AIAction());
                    aiActions[actionIndex].type = GameAction.PlayCard;
                    aiActions[actionIndex].slot = new Slot(slotCordinate, 1, 0);

                    actionIndex++;
                }

                aiActions.Add(new AIAction());
                aiActions[actionIndex].type = GameAction.EndTurn;
            }

            foreach (var aiAction in aiActions)
            {
                yield return new WaitForSeconds(0.5f);
                ExecuteOrder(aiAction);
            }

            ai_logic.ClearMemory();

            yield return new WaitForSeconds(0.5f);
            is_playing = false;
        }

        List<int> getNRandomValidSlotsForFire(Game game_data, bool start, int n)
        {

        }

        int getRandomValidSlotForFire(Game game_data, bool start = false)
        {
            // Get all empty slots
            // filter out slots that are not adjacent to a fire
            // filter out slots that are adjacent to fire fighters

            List<int> validSlots = new List<int>();
            List<int> emptySlots = new List<int>();
            List<int> fireFighterSlots = new List<int>();
            List<int> fireSlots = new List<int>();
            List<int> adjacentFireFighterSlots = new List<int>();

            foreach (Slot slot in Slot.GetAll())
            {
                Card card = game_data.GetSlotCard(slot);
                if (card == null)
                {
                    emptySlots.Add(slot.x);
                }
                else if (card.card_id == "dale_hudson")
                {
                    int fireFighterLocation = slot.x;
                    int[] adjacentCoordinates = Utilities.getAdjacentCoordinates(fireFighterLocation);
                    foreach (int coordinate in adjacentCoordinates)
                    {
                        if (coordinate != 0)
                        {
                            adjacentFireFighterSlots.Add(coordinate);
                        }
                    }
                }
                else if (card.card_id == "fire_truck")
                {
                    int fireFighterLocation = slot.x;
                    int[] adjacentCoordinates = Utilities.getAdjacentCoordinates(fireFighterLocation);
                    foreach (int coordinate in adjacentCoordinates)
                    {
                        if (coordinate != 0)
                        {
                            adjacentFireFighterSlots.Add(coordinate);
                        }
                    }
                }
                else if (card.card_id == "firefighter_2")
                {
                    int fireFighterLocation = slot.x;
                    int[] adjacentCoordinates = Utilities.getAdjacentCoordinates(fireFighterLocation);
                    foreach (int coordinate in adjacentCoordinates)
                    {
                        if (coordinate != 0)
                        {
                            adjacentFireFighterSlots.Add(coordinate);
                        }
                    }
                }
                else if (card.card_id == "firefighter_2")
                {
                    int fireFighterLocation = slot.x;
                    int[] adjacentCoordinates = Utilities.getAdjacentCoordinates(fireFighterLocation);
                    foreach (int coordinate in adjacentCoordinates)
                    {
                        if (coordinate != 0)
                        {
                            adjacentFireFighterSlots.Add(coordinate);
                        }
                    }
                }

            }

            foreach (int slot in emptySlots)
            {
                if (!adjacentFireFighterSlots.Contains(slot))
                {
                    validSlots.Add(slot);
                }
            }

            return validSlots[Random.Range(0, validSlots.Count)];
        }

        private void Stop()
        {
            ai_logic.Stop();
            is_playing = false;
        }

        //----------

        private void ExecuteOrder(AIAction order)
        {
            if (!CanPlay())
                return;

            if (order.type == GameAction.PlayCard)
            {
                PlayCard(order.card_uid, order.slot);
            }

            if (order.type == GameAction.Attack)
            {
                AttackCard(order.card_uid, order.target_uid);
            }

            if (order.type == GameAction.AttackPlayer)
            {
                AttackPlayer(order.card_uid, order.target_player_id);
            }

            if (order.type == GameAction.Move)
            {
                MoveCard(order.card_uid, order.slot);
            }

            if (order.type == GameAction.CastAbility)
            {
                CastAbility(order.card_uid, order.ability_id);
            }

            if (order.type == GameAction.SelectCard)
            {
                SelectCard(order.target_uid);
            }

            if (order.type == GameAction.SelectPlayer)
            {
                SelectPlayer(order.target_player_id);
            }

            if (order.type == GameAction.SelectSlot)
            {
                SelectSlot(order.slot);
            }

            if (order.type == GameAction.SelectChoice)
            {
                SelectChoice(order.value);
            }

            if (order.type == GameAction.CancelSelect)
            {
                CancelSelect();
            }

            if (order.type == GameAction.EndTurn)
            {

                EndTurn();
            }

            if (order.type == GameAction.Resign)
            {
                Resign();
            }
        }

        private void PlayCard(string card_uid, Slot slot)
        {
            Game game_data = gameplay.GetGameData();
            Player player = game_data.GetPlayer(game_data.current_player);
            Card random = player.GetRandomCard(player.cards_hand, rand);

            if (random != null)
            {
                gameplay.PlayCard(random, slot);
            }
        }

        private void MoveCard(string card_uid, Slot slot)
        {
            Game game_data = gameplay.GetGameData();
            Card card = game_data.GetCard(card_uid);
            if (card != null)
            {
                gameplay.MoveCard(card, slot);
            }
        }

        private void AttackCard(string attacker_uid, string target_uid)
        {
            Game game_data = gameplay.GetGameData();
            Card card = game_data.GetCard(attacker_uid);
            Card target = game_data.GetCard(target_uid);
            if (card != null && target != null)
            {
                gameplay.AttackTarget(card, target);
            }
        }

        private void AttackPlayer(string attacker_uid, int target_player_id)
        {
            Game game_data = gameplay.GetGameData();
            Card card = game_data.GetCard(attacker_uid);
            if (card != null)
            {
                Player oplayer = game_data.GetPlayer(target_player_id);
                gameplay.AttackPlayer(card, oplayer);
            }
        }

        private void CastAbility(string caster_uid, string ability_id)
        {
            Game game_data = gameplay.GetGameData();
            Card caster = game_data.GetCard(caster_uid);
            AbilityData iability = AbilityData.Get(ability_id);
            if (caster != null && iability != null)
            {
                gameplay.CastAbility(caster, iability);
            }
        }

        private void SelectCard(string target_uid)
        {
            Game game_data = gameplay.GetGameData();
            Card target = game_data.GetCard(target_uid);
            if (target != null)
            {
                gameplay.SelectCard(target);
            }
        }

        private void SelectPlayer(int tplayer_id)
        {
            Game game_data = gameplay.GetGameData();
            Player target = game_data.GetPlayer(tplayer_id);
            if (target != null)
            {
                gameplay.SelectPlayer(target);
            }
        }

        private void SelectSlot(Slot slot)
        {
            if (slot != Slot.None)
            {
                gameplay.SelectSlot(slot);
            }
        }

        private void SelectChoice(int choice)
        {
            gameplay.SelectChoice(choice);
        }

        private void CancelSelect()
        {
            if (CanPlay())
            {
                gameplay.CancelSelection();
            }
        }

        private void EndTurn()
        {
            if (CanPlay())
            {
                gameplay.EndTurn();
            }
        }

        private void Resign()
        {
            int other = player_id == 0 ? 1 : 0;
            gameplay.EndGame(other);
        }

    }

}