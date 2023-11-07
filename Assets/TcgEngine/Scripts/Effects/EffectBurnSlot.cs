using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using TcgEngine.Gameplay;

namespace TcgEngine
{
    /// <summary>
    /// Effect to play a card from your hand for free
    /// </summary>

    [CreateAssetMenu(fileName = "effect", menuName = "TcgEngine/Effect/BurnSlot", order = 10)]
    public class EffectBurnSlot : EffectData
    {
        public override void DoEffect(GameLogic logic, AbilityData ability, Card caster, Player target)
        {

            Debug.Log("Fight");
            Player player = logic.GameData.GetPlayer(caster.player_id);
            int fireCoordinate = caster.slot.x;

            


            Debug.Log("Fire Effect at " + fireCoordinate + " and card is " + caster.card_id);


            Game game = logic.GetGameData();

            /*
             * caster.slot.health += -1;
             * Slot.UpdateSlot(caster.slot, fireCoordinate)
             * if caster.slot.health < 1{
             *      set condition isBurned
             *      destroy fire
             *      DamagePlayer(caster, target, 1);
             * }
             */
        }
    }
}