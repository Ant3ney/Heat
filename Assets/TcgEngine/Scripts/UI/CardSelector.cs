using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TcgEngine.Client;
using TcgEngine;

namespace TcgEngine.UI
{
    /// <summary>
    /// The UI for card selector, appears when an ability with CardSelector target is triggered
    /// </summary>

    public class CardSelector : UIPanel
    {
        public RectTransform content;
        public GameObject card_template;
        public Text title;
        public Text subtitle;
        public GameObject select_button;
        public Text select_button_text;
        public float card_space = 100f;

        private AbilityData iability;
        private List<Card> card_list;
        private ListSwap<Card> cards_array = new ListSwap<Card>();
        private List<CardSelectorCard> card_img_list = new List<CardSelectorCard>();

        private Vector2 mouse_start;
        private int mouse_index_start;
        private bool drag = false;
        private float mouse_scroll = 0f;
        private float timer = 0f;

        private int current_index = 0;

        private static CardSelector _instance;

        protected override void Awake()
        {
            base.Awake();
            _instance = this;
            card_template.SetActive(false);
            Hide();
        }

        protected override void Update()
        {
            base.Update();

            timer += Time.deltaTime;

            //Drag cards
            if (drag)
            {
                Vector2 mouse_pos = GetMousePos();
                Vector2 move = mouse_pos - mouse_start;
                if (move.magnitude > 1f)
                    current_index = mouse_index_start - Mathf.RoundToInt(move.x / card_space);
                current_index = Mathf.Clamp(current_index, 0, card_img_list.Count - 1);
            }

            //Mouse scroll
            mouse_scroll += -Input.mouseScrollDelta.y;
            if (mouse_scroll > 0.5f)
            {
                OnClickNext(1);
                mouse_scroll -= 1f;
            }
            else if (mouse_scroll < -0.5f)
            {
                OnClickNext(-1);
                mouse_scroll += 1f;
            }

            //Refresh cards
            foreach (CardSelectorCard card in card_img_list)
            {
                bool isCurrent = card.display_index == current_index;
                card.target_pos = GetCardPos(card);
                card.target_scale = isCurrent ? Vector3.one : Vector3.one / 2f;
            }

            //Close on right click if not a selection
            if (iability == null && Input.GetMouseButtonDown(1) && timer > 1f)
                Hide();

            Game game = GameClient.Get().GetGameData();
            if (game != null && iability != null && game.selector == SelectorType.None)
                Hide(); //Ability was selected already, close panel
        }

        private void RefreshSelector()
        {
            foreach (CardSelectorCard card in card_img_list)
                Destroy(card.gameObject);
            card_img_list.Clear();
            drag = false;
            mouse_scroll = 0f;

            select_button_text.text = (iability != null) ? "Select" : "OK";
            select_button.SetActive(iability != null);

            int index = 0;
            int image_index = 0;
            foreach (Card card in card_list)
            {
                CardData icard = CardData.Get(card.card_id);
                if (icard != null)
                {
                    GameObject card_obj = Instantiate(card_template, content.transform);
                    card_obj.SetActive(true);
                    RectTransform card_rect = card_obj.GetComponent<RectTransform>();
                    CardSelectorCard card_img = card_obj.GetComponent<CardSelectorCard>();
                    card_img.SetCard(index, image_index, card);
                    card_img.target_pos = GetCardPos(card_img);
                    card_rect.anchoredPosition = card_img.target_pos;
                    card_img_list.Add(card_img);
                    image_index++;
                }
                index++;
            }
        }

        private Vector2 GetCardPos(CardSelectorCard card)
        {
            bool isCurrent = card.display_index == current_index;
            int pos_index = card.display_index - current_index;
            Vector2 pos = new Vector2(pos_index * card_space, isCurrent ? 40f : 0f);
            if (pos_index != 0)
                pos += Vector2.right * Mathf.Sign(pos_index) * 140f;
            return pos;
        }

        private Vector2 GetMousePos()
        {
            Vector2 localpoint;
            RectTransformUtility.ScreenPointToLocalPointInRectangle(content, Input.mousePosition, GetComponentInParent<Canvas>().worldCamera, out localpoint);
            //Vector2 normalizedPoint = Rect.PointToNormalized(content.rect, localpoint);
            return localpoint;
        }

        public void OnPointerDown()
        {
            mouse_start = GetMousePos();
            mouse_index_start = current_index;
            drag = true;
        }

        public void OnPointerUp()
        {
            drag = false;
            Vector2 mouse_pos = GetMousePos();
            Vector2 move = mouse_pos - mouse_start;
            if (move.magnitude < 2)
            {
                if (mouse_pos.x > 100f)
                    current_index += 1;
                else if (mouse_pos.x < -100f)
                    current_index -= 1;
                current_index = Mathf.Clamp(current_index, 0, card_img_list.Count - 1);
            }
        }

        public void OnClickOK()
        {
            Game data = GameClient.Get().GetGameData();
            if (iability != null && data.selector == SelectorType.SelectorCard)
            {
                Card selected_card = null;
                CardSelectorCard selector_card = null;
                if (current_index >= 0 && current_index < card_img_list.Count)
                    selector_card = card_img_list[current_index];
                if (selector_card != null && selector_card.card_index < card_list.Count)
                    selected_card = card_list[selector_card.card_index];

                Card caster = data.GetCard(data.selector_caster_uid);
                if (selected_card != null && iability.AreTargetConditionsMet(data, caster, selected_card))
                {
                    GameClient.Get().SelectCard(selected_card);
                    Hide();
                }
            }
            else
            {
                Hide();
            }
        }

        public void OnClickCancel()
        {
            GameClient.Get().CancelSelection();
            Hide();
        }

        public void OnClickNext(int dir)
        {
            current_index += dir;
            current_index = Mathf.Clamp(current_index, 0, card_img_list.Count - 1);
        }

        //Show ability
        public void Show(AbilityData iability, Card caster)
        {
            Game data = GameClient.Get().GetGameData();
            this.card_list = iability.GetCardTargets(data, caster);
            this.iability = iability;
            title.text = iability.title;
            subtitle.text = iability.desc;
            current_index = 0;
            timer = 0f;
            Show();
            RefreshSelector();
        }

        //Show deck/discard
        public void Show(List<Card> card_list, string title)
        {
            this.card_list = new List<Card>(card_list);
            this.card_list.Sort((Card a, Card b) => { return a.CardData.title.CompareTo(b.CardData.title); }); //Reorder to not show the deck order
            this.iability = null;
            this.title.text = title;
            subtitle.text = "";
            current_index = 0;
            timer = 0f;
            Show();
            RefreshSelector();
        }

        public bool IsAbility()
        {
            return IsVisible() && iability != null;
        }

        public static CardSelector Get()
        {
            return _instance;
        }
    }
}