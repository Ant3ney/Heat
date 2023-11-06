using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using TcgEngine.Gameplay;

namespace TcgEngine
{
    /// <summary>
    /// Effect to play a card from your hand for free
    /// </summary>

    [CreateAssetMenu(fileName = "effect", menuName = "TcgEngine/Effect/FightFire", order = 10)]
    public class EffectFightFire : EffectData
    {
        public override void DoEffect(GameLogic logic, AbilityData ability, Card caster, Player target)
        {
            Player player = logic.GameData.GetPlayer(caster.player_id);
            int fireFighterCoordinate = caster.slot.x;



            Debug.Log("Fight Fire Effect at " + fireFighterCoordinate + " and card is " + caster.card_id);




            int[] adjacentCoordinates = Utilities.getAdjacentCoordinates(fireFighterCoordinate);
            /* string adjacentCoordinatesLog = "Adjacent Coordinates: " + adjacentCoordinates.Length;
            foreach (int coordinate in adjacentCoordinates)
            {
                adjacentCoordinatesLog += " " + coordinate;
            } */
            /* Debug.Log(adjacentCoordinatesLog); */
            List<Card> adjacentFireCards = new List<Card>();
            Game game = logic.GetGameData();
            foreach (int coordinate in adjacentCoordinates)
            {
                if (coordinate != 0)
                {
                    Slot slot = new Slot(coordinate, 1, 0);
                    Card card = game.GetSlotCard(slot);
                    if (card != null && card.card_id == "forest_fire")
                    {
                        adjacentFireCards.Add(card);
                    }
                }
            }
            foreach (Card card in adjacentFireCards)
            {
                logic.DamageCard(card, 1);
            }
        }
    }
}