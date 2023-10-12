using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TcgEngine;

namespace TcgEngine.UI
{
    /// <summary>
    /// One card in the CardSelector
    /// </summary>

    public class CardSelectorCard : MonoBehaviour
    {
        public CardUI card_ui;

        [HideInInspector]
        public int card_index;
        [HideInInspector]
        public int display_index;
        [HideInInspector]
        public Vector2 target_pos;
        [HideInInspector]
        public Vector3 target_scale;

        [HideInInspector]
        public Card card;

        private RectTransform rect;

        private void Awake()
        {
            rect = GetComponent<RectTransform>();
            transform.localScale = Vector2.one / 2f;
        }

        private void Update()
        {
            rect.anchoredPosition = Vector2.Lerp(rect.anchoredPosition, target_pos, 8f * Time.deltaTime);
            transform.localScale = Vector2.Lerp(transform.localScale, target_scale, 4f * Time.deltaTime);
        }

        public void SetCard(int card_index, int display_index, Card card)
        {
            this.card_index = card_index;
            this.display_index = display_index;
            this.card = card;
            CardData icard = CardData.Get(card.card_id);
            card_ui.SetCard(icard, card.VariantData);
        }

    }
}
