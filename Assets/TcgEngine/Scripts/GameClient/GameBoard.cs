using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using TcgEngine.Client;
using UnityEngine.Events;
using TcgEngine.UI;

namespace TcgEngine.Client
{
    /// <summary>
    /// GameBoard takes care of spawning and despawning BoardCards, based on the refreshed data received from the server
    /// It also ends the game when the server sends a endgame
    /// </summary>

    public class GameBoard : MonoBehaviour
    {
        public GameObject card_prefab;

        public UnityAction<Card> onCardSpawned;
        public UnityAction<Card> onCardKilled;

        private bool game_ended = false;

        private static GameBoard _instance;

        void Awake()
        {
            _instance = this;
        }

        private void Start()
        {
            
        }

        void Update()
        {
            if (!GameClient.Get().IsReady())
                return;

            int player_id = GameClient.Get().GetPlayerID();
            Game data = GameClient.Get().GetGameData();

            //--- Battle cards --------

            List<BoardCard> cards = BoardCard.GetAll();

            //Add missing cards
            foreach (Player p in data.players)
            {
                foreach (Card card in p.cards_board)
                {
                    BoardCard bcard = BoardCard.Get(card.uid);
                    if (card != null && bcard == null)
                        SpawnNewCard(card);
                }
            }

            //Vanish removed cards
            for (int i = cards.Count - 1; i >= 0; i--)
            {
                BoardCard card = cards[i];
                if (card && data.GetBoardCard(card.GetCard().uid) == null && !card.IsDead())
                {
                    card.Kill();
                    onCardKilled?.Invoke(card.GetCard());
                }
            }

            //--- End Game ----
            if (!game_ended && data.state == GameState.GameEnded)
            {
                game_ended = true;
                EndGame();
            }
        }

        private void SpawnNewCard(Card card)
        {
            GameObject card_obj = Instantiate(card_prefab, Vector3.zero, Quaternion.identity);
            card_obj.SetActive(true);
            card_obj.GetComponent<BoardCard>().SetCard(card);
            onCardSpawned?.Invoke(card);
        }

        private void EndGame()
        {
            StartCoroutine(EndGameRun());
        }

        private IEnumerator EndGameRun()
        {
            Game data = GameClient.Get().GetGameData();
            Player pwinner = data.GetPlayer(data.current_player);
            Player player = GameClient.Get().GetPlayer();
            bool win = pwinner != null && player.player_id == pwinner.player_id;
            bool tied = pwinner == null;

            AudioTool.Get().FadeOutMusic("music");

            yield return new WaitForSeconds(1f);

            if (win)
                PlayerUI.Get(true).Kill();
            if (!win && !tied)
                PlayerUI.Get(false).Kill();

            if (win && AssetData.Get().win_fx != null)
                Instantiate(AssetData.Get().win_fx, Vector3.zero, Quaternion.identity);
            else if (tied && AssetData.Get().tied_fx != null)
                Instantiate(AssetData.Get().tied_fx, Vector3.zero, Quaternion.identity);
            else if (tied && AssetData.Get().lose_fx != null)
                Instantiate(AssetData.Get().lose_fx, Vector3.zero, Quaternion.identity);

            if (win)
                AudioTool.Get().PlaySFX("ending_sfx", AssetData.Get().win_audio);
            else
                AudioTool.Get().PlaySFX("ending_sfx", AssetData.Get().defeat_audio);

            if (win)
                AudioTool.Get().PlayMusic("music", AssetData.Get().win_music, 0.4f, false);
            else
                AudioTool.Get().PlayMusic("music", AssetData.Get().defeat_music, 0.4f, false);

            yield return new WaitForSeconds(2f);


            EndGamePanel.Get().ShowWinner(data.current_player);
        }

        //Raycast mouse position to board position
        public Vector3 RaycastMouseBoard()
        {
            Ray ray = GameCamera.Get().MouseToRay(Input.mousePosition);
            Plane plane = new Plane(transform.forward, 0f);
            bool success = plane.Raycast(ray, out float dist);
            if (success)
                return ray.GetPoint(dist);
            return Vector3.zero;
        }

        public Vector3 GetAngles()
        {
            return transform.rotation.eulerAngles;
        }

        public static GameBoard Get()
        {
            return _instance;
        }
    }
}