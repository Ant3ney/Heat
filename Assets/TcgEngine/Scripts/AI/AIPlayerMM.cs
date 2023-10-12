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
                TimeTool.StartCoroutine(AiTurn());
            }

            if (!game_data.IsPlayerTurn(player) && ai_logic.IsRunning())
                Stop();
        }

        private IEnumerator AiTurn()
        {
            yield return new WaitForSeconds(1f);

            Game game_data = gameplay.GetGameData();
            ai_logic.RunAI(game_data);

            while (ai_logic.IsRunning())
            {
                yield return new WaitForSeconds(0.1f);
            }

            AIAction best = ai_logic.GetBestAction();

            if (best != null)
            {
                Debug.Log("Execute AI Action: " + best.GetText(game_data) + "\n" + ai_logic.GetNodePath());
                //foreach (NodeState node in ai_logic.GetFirst().childs)
                //   Debug.Log(ai_logic.GetNodePath(node));

                ExecuteOrder(best);
            }

            ai_logic.ClearMemory();

            yield return new WaitForSeconds(0.5f);
            is_playing = false;
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
            Card card = game_data.GetCard(card_uid);
            if (card != null)
            {
                gameplay.PlayCard(card, slot);
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