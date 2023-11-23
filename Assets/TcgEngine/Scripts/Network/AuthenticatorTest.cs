using System.Collections;
using System.Collections.Generic;
using System.Threading.Tasks;
using UnityEngine;

namespace TcgEngine
{
    /// <summary>
    /// Test authenticator just generates a random ID to use as user id
    /// This is very useful to test the game in multiplayer without needing to login each time
    /// Unity Services features won't work in test mode (Relay, Cloud Saves...)
    /// Use Anonymous mode to test those features (after connecting your project ID in services window)
    /// </summary>

    public class AuthenticatorTest : Authenticator
    {
        private UserData udata = null;

        public override async Task<bool> Register(string username, string email, string password)
        {
            Debug.Log("Registering user " + username);
            this.user_id = username;  //User username as ID for save file consistency when testing
            this.username = username;
            logged_in = true;
            await Task.Yield(); //Do nothing
            PlayerPrefs.SetString("tcg_user", username); //Save last user
            PlayerPrefs.SetString("tcg_pass", password); //Save last password
            RegisterResponse success = await ApiClient.Register(username, email, password);
            return true;
        }
        public override async Task<bool> Login(string username, string password)
        {
            this.user_id = username;  //User username as ID for save file consistency when testing
            this.username = username;
            logged_in = true;
            await Task.Yield(); //Do nothing
            PlayerPrefs.SetString("tcg_user", username); //Save last user
            PlayerPrefs.SetString("tcg_pass", password); //Save last password
            return true;
        }

        public override async Task<bool> RefreshLogin()
        {
            string username = PlayerPrefs.GetString("tcg_user", "");
            string password = PlayerPrefs.GetString("tcg_pass", "");
            if (!string.IsNullOrEmpty(username) && !string.IsNullOrEmpty(password))
            {
                bool success = await Login(username, password);
                return success;
            }
            return false;
        }

        public override async Task<UserData> LoadUserData()
        {
            string user = PlayerPrefs.GetString("tcg_user", "");
            string file = username + ".user";
            if (!string.IsNullOrEmpty(user) && SaveTool.DoesFileExist(file))
            {
                udata = SaveTool.LoadFile<UserData>(file);
            }

            if (udata == null)
            {
                udata = new UserData();
                udata.username = username;
                udata.id = username;
            }

            await Task.Yield(); //Do nothing
            return udata;
        }

        public override async Task<bool> SaveUserData()
        {
            if (udata != null && SaveTool.IsValidFilename(username))
            {
                string file = username + ".user";
                SaveTool.SaveFile<UserData>(file, udata);
                await Task.Yield(); //Do nothing
                return true;
            }
            return false;
        }

        public override void Logout()
        {
            base.Logout();
            udata = null;
            PlayerPrefs.DeleteKey("tcg_user");
        }

        public override UserData GetUserData()
        {
            return udata;
        }
    }
}
