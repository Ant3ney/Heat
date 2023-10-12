using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TcgEngine.Client;

namespace TcgEngine.UI
{
    /// <summary>
    /// The choice selector is a box that appears when using an ability with ChoiceSelector as target
    /// it let you choose between different abilities
    /// </summary>

    public class ChoiceSelector : UIPanel
    {
        public ChoiceSelectorChoice[] choices;

        private Card caster;
        private AbilityData ability;

        private static ChoiceSelector _instance;

        protected override void Awake()
        {
            base.Awake();
            _instance = this;
        }

        protected override void Start()
        {
            base.Start();

            foreach (ChoiceSelectorChoice choice in choices)
                choice.onClick += OnClickChoice;
        }

        protected override void Update()
        {
            base.Update();

            Game game = GameClient.Get().GetGameData();
            if (game != null && game.selector == SelectorType.None)
                Hide();
        }

        private void RefreshSelector()
        {
            foreach (ChoiceSelectorChoice choice in choices)
                choice.Hide();

            Game gdata = GameClient.Get().GetGameData();
            Player player = GameClient.Get().GetPlayer();

            if (ability != null)
            {
                int index = 0;
                foreach (AbilityData choice in ability.chain_abilities)
                {
                    if (choice != null && index < choices.Length)
                    {
                        ChoiceSelectorChoice achoice = choices[index];
                        achoice.SetChoice(index, choice);
                        achoice.SetInteractable(gdata.CanSelectAbility(caster, choice));
                    }
                    index++;
                }
            }
        }

        public void OnClickChoice(int index)
        {
            Game data = GameClient.Get().GetGameData();
            if (data.selector == SelectorType.SelectorChoice)
            {
                GameClient.Get().SelectChoice(index);
                Hide();
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

        public void Show(AbilityData iability, Card caster)
        {
            this.caster = caster;
            this.ability = iability;
            Show();
            RefreshSelector();
        }

        public static ChoiceSelector Get()
        {
            return _instance;
        }
    }
}
