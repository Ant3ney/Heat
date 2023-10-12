using System.Collections;
using System.Collections.Generic;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.UI;

namespace TcgEngine
{
    /// <summary>
    /// Use this tool to upload your cards, packs and rewards to the Mongo Database (it will overwrite existing data)
    /// </summary>

    public class CardUploader : MonoBehaviour
    {
        public string username = "admin";

        [Header("References")]
        public InputField username_txt;
        public InputField password_txt;
        public Text msg_text;

        [Header("Upload")]
        public bool upload_cards = true;
        public bool upload_packs = true;
        public bool upload_decks = true;
        public bool upload_variants = true;
        public bool upload_rewards = true;

        void Start()
        {
            username_txt.text = username;
            msg_text.text = "";
        }

        private async void Login()
        {
            LoginResponse res = await ApiClient.Get().Login(username_txt.text, password_txt.text);
            if (res.success && res.permission_level >= 10)
            {
                UploadAll();
            }
            else
            {
                ShowText("Admin Login Failed");
            }
        }

        private async void UploadAll()
        {
            //Delete previous data
            ShowText("Deleting previous data...");

            if(upload_packs)
                await DeleteAllPacks();
            if (upload_cards)
                await DeleteAllCards();
            if (upload_variants)
                await DeleteAllVariants();
            if (upload_decks)
                await DeleteAllDecks();
            if (upload_rewards)
                await DeleteAllRewards();

            //Packs
            if (upload_packs)
            {
                List<PackData> packs = PackData.GetAll();
                for (int i = 0; i < packs.Count; i++)
                {
                    PackData pack = packs[i];
                    if (pack.available)
                    {
                        ShowText("Uploading: " + pack.id);
                        UploadPack(pack);
                        await TimeTool.Delay(100);
                    }
                }
            }

            //Cards
            if (upload_cards)
            {
                List<CardData> cards = CardData.GetAll();
                for (int i = 0; i < cards.Count; i++)
                {
                    CardData card = cards[i];
                    if (card.deckbuilding)
                    {
                        ShowText("Uploading: " + card.id);
                        UploadCard(card);
                        await TimeTool.Delay(100);
                    }
                }
            }

            //Variants
            if (upload_variants)
            {
                List<VariantData> variants = VariantData.GetAll();
                for (int i = 0; i < variants.Count; i++)
                {
                    VariantData variant = variants[i];
                    ShowText("Uploading: " + variant.id);
                    UploadVariant(variant);
                    await TimeTool.Delay(100);
                }
            }

            //Starter Decks
            if (upload_decks)
            {
                DeckData[] decks = GameplayData.Get().starter_decks;
                for (int i = 0; i < decks.Length; i++)
                {
                    DeckData deck = decks[i];
                    ShowText("Uploading: " + deck.id);
                    UploadDeck(deck);
                    UploadDeckReward(deck);
                    await TimeTool.Delay(100);
                }
            }

            //Solo rewards
            if (upload_rewards)
            {
                List<LevelData> levels = LevelData.GetAll();
                for (int i = 0; i < levels.Count; i++)
                {
                    LevelData level = levels[i];
                    ShowText("Uploading: " + level.id);
                    UploadLevelReward(level);
                    await TimeTool.Delay(100);
                }
            }

            //Custom rewards
            if (upload_rewards)
            {
                List<RewardData> rewards = RewardData.GetAll();
                for (int i = 0; i < rewards.Count; i++)
                {
                    RewardData reward = rewards[i];
                    ShowText("Uploading: " + reward.id);
                    UploadReward(reward);
                    await TimeTool.Delay(100);
                }
            }

            ShowText("Completed!");
            ApiClient.Get().Logout();
        }

        private async Task DeleteAllPacks()
        {
            string url = ApiClient.ServerURL + "/packs";
            await ApiClient.Get().SendRequest(url, WebRequest.METHOD_DELETE);
        }

        private async Task DeleteAllCards()
        {
            string url = ApiClient.ServerURL + "/cards";
            await ApiClient.Get().SendRequest(url, WebRequest.METHOD_DELETE);
        }

        private async Task DeleteAllVariants()
        {
            string url = ApiClient.ServerURL + "/variants";
            await ApiClient.Get().SendRequest(url, WebRequest.METHOD_DELETE);
        }

        private async Task DeleteAllDecks()
        {
            string url = ApiClient.ServerURL + "/decks";
            await ApiClient.Get().SendRequest(url, WebRequest.METHOD_DELETE);
        }

        private async Task DeleteAllRewards()
        {
            string url = ApiClient.ServerURL + "/rewards";
            await ApiClient.Get().SendRequest(url, WebRequest.METHOD_DELETE);
        }

        private async void UploadPack(PackData pack)
        {
            PackAddRequest req = new PackAddRequest();
            req.tid = pack.id;
            req.cards = pack.cards;
            req.cost = pack.cost;
            req.random = pack.type == PackType.Random;

            req.rarities_1st = new PackAddProbability[pack.rarities_1st.Length];
            req.rarities = new PackAddProbability[pack.rarities.Length];
            req.variants = new PackAddProbability[pack.variants.Length];

            for (int i = 0; i < req.rarities_1st.Length; i++)
                req.rarities_1st[i] = AddPackRarity(pack.rarities_1st[i]);

            for (int i = 0; i < req.rarities.Length; i++)
                req.rarities[i] = AddPackRarity(pack.rarities[i]);

            for (int i = 0; i < req.variants.Length; i++)
                req.variants[i] = AddPackVariant(pack.variants[i]);

            string url = ApiClient.ServerURL + "/packs/add";
            string json = ApiTool.ToJson(req);
            await ApiClient.Get().SendPostRequest(url, json);
        }

        private PackAddProbability AddPackRarity(PackRarity rarity)
        {
            PackAddProbability add = new PackAddProbability();
            add.tid = rarity.rarity.id;
            add.value = rarity.probability;
            return add;
        }

        private PackAddProbability AddPackVariant(PackVariant rarity)
        {
            PackAddProbability add = new PackAddProbability();
            add.tid = rarity.variant.id;
            add.value = rarity.probability;
            return add;
        }

        private async void UploadCard(CardData card)
        {
            CardAddRequest req = new CardAddRequest();
            req.tid = card.id;
            req.type = card.GetTypeId();
            req.team = card.team.id;
            req.rarity = card.rarity.id;
            req.mana = card.mana;
            req.attack = card.attack;
            req.hp = card.hp;
            req.cost = card.cost;
            req.packs = new string[card.packs.Length];

            for (int i = 0; i < req.packs.Length; i++)
            {
                req.packs[i] = card.packs[i].id;
            }

            string url = ApiClient.ServerURL + "/cards/add";
            string json = ApiTool.ToJson(req);
            await ApiClient.Get().SendPostRequest(url, json);
        }

        private async void UploadVariant(VariantData variant)
        {
            VariantAddRequest req = new VariantAddRequest();
            req.tid = variant.id;
            req.cost_factor = variant.cost_factor;
            req.is_default = variant.is_default;

            string url = ApiClient.ServerURL + "/variants/add";
            string json = ApiTool.ToJson(req);
            await ApiClient.Get().SendPostRequest(url, json);
        }

        private async void UploadDeckReward(DeckData deck)
        {
            RewardAddRequest req = new RewardAddRequest();
            req.tid = deck.id;
            req.group = "starter_deck";
            req.decks = new string[1] { deck.id };

            string url = ApiClient.ServerURL + "/rewards/add";
            string json = ApiTool.ToJson(req);
            await ApiClient.Get().SendPostRequest(url, json);
        }

        private async void UploadDeck(DeckData deck)
        {
            UserDeckData req = new UserDeckData(deck);
            string url = ApiClient.ServerURL + "/decks/add";
            string json = ApiTool.ToJson(req);
            await ApiClient.Get().SendPostRequest(url, json);
        }

        private async void UploadReward(RewardData reward)
        {
            RewardAddRequest req = new RewardAddRequest();
            req.tid = reward.id;
            req.group = "";
            req.coins = reward.coins;
            req.xp = reward.xp;
            req.repeat = reward.repeat;

            req.cards = new string[reward.cards.Length];
            for (int i = 0; i < reward.cards.Length; i++)
            {
                req.cards[i] = reward.cards[i].id;
            }

            req.cards = new string[reward.decks.Length];
            for (int i = 0; i < reward.decks.Length; i++)
            {
                req.cards[i] = reward.decks[i].id;
            }

            req.packs = new string[reward.packs.Length];
            for (int i = 0; i < reward.packs.Length; i++)
            {
                req.packs[i] = reward.packs[i].id;
            }

            string url = ApiClient.ServerURL + "/rewards/add";
            string json = ApiTool.ToJson(req);
            await ApiClient.Get().SendPostRequest(url, json);
        }

        private async void UploadLevelReward(LevelData level)
        {
            RewardAddRequest req = new RewardAddRequest();
            req.tid = level.id;
            req.group = "";
            req.coins = level.reward_coins;
            req.xp = level.reward_xp;

            req.cards = new string[level.reward_cards.Length];
            for (int i = 0; i < level.reward_cards.Length; i++)
            {
                req.cards[i] = level.reward_cards[i].id;
            }

            req.packs = new string[level.reward_packs.Length];
            for (int i = 0; i < level.reward_packs.Length; i++)
            {
                req.packs[i] = level.reward_packs[i].id;
            }

            string url = ApiClient.ServerURL + "/rewards/add";
            string json = ApiTool.ToJson(req);
            await ApiClient.Get().SendPostRequest(url, json);
        }

        private void ShowText(string txt)
        {
            msg_text.text = txt;
            Debug.Log(txt);
        }

        public void OnClickStart()
        {
            msg_text.text = "";
            Login();
        }
    }

    [System.Serializable]
    public class CardAddRequest
    {
        public string tid;
        public string type;
        public string team;
        public string rarity;
        public int mana;
        public int attack;
        public int hp;
        public int cost;
        public string[] packs;
    }

    [System.Serializable]
    public class PackAddRequest
    {
        public string tid;
        public int cards;
        public int cost;
        public bool random;
        public PackAddProbability[] rarities_1st;
        public PackAddProbability[] rarities;
        public PackAddProbability[] variants;
    }

    [System.Serializable]
    public class PackAddProbability
    {
        public string tid;
        public int value;
    }

    [System.Serializable]
    public class VariantAddRequest
    {
        public string tid;
        public int cost_factor;
        public bool is_default;
    }

    [System.Serializable]
    public class RewardAddRequest
    {
        public string tid;
        public string group;
        public int coins;
        public int xp;
        public string[] packs;
        public string[] cards;
        public string[] decks;
        public bool repeat;
    }
}
