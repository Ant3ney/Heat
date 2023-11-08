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

            
            Player player = logic.GameData.GetPlayer(caster.player_id);
            int fireCoordinate = caster.slot.x;
            Slot real_caster_slot = Slot.Get(fireCoordinate, 1, 0);
            Debug.Log("caster.slot.health: " + real_caster_slot.health);


            Debug.Log("Fire Effect at " + fireCoordinate + " and card is " + caster.card_id);


            Game game = logic.GetGameData();

            /* Slot.setHealth(real_caster_slot.health - 1, fireCoordinate); */

            List<Slot> slots = Slot.GetAll();
            Slot fireCordinateSlot = new Slot(fireCoordinate, 1, 0);
            if(real_caster_slot.health > 0){
                int newHealth = real_caster_slot.health - 1;
                fireCordinateSlot.health = newHealth;
                Slot.updateSlot(fireCordinateSlot, fireCoordinate); 

                if(newHealth < 1){
                    logic.DamageCard(caster, 99999); // Remove card
                }
            }
            

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