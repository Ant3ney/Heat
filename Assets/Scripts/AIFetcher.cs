
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System;
using System.Net;
using System.IO;
using System.Text;
public static class AIFetcher
{
    public static IEnumerator test()
    {
        Debug.Log("Testing AI fetcher");
        int result = 42; // Replace with actual logic to determine the result
        yield return result; // This will be the Current value of the IEnumerator
    }
    public static IEnumerator fetchFireSpreadCoordinates(List<FireSpreadItemRequestPayload> fireSpreadItemRequestPayload)
    {
        Debug.Log("Fetching fire spread coordinates");
        // Prepare the POST request data
        string url = "https://heat.singularitydevelopment.com/ai/query";

        string data = "{ \"fires\": [";

        int i = 0;
        foreach (FireSpreadItemRequestPayload item in fireSpreadItemRequestPayload)
        {
            data += "{\"center\": " + item.coordinate + ", \"severity\": \"" + item.severity + "\"}";
            if (i < fireSpreadItemRequestPayload.Count - 1)
            {
                data += ",";
            }
            i++;
        }

        data += "]}";
        Debug.Log(data);

        // Create the web request
        var request = (HttpWebRequest)WebRequest.Create(url);
        request.Method = "POST";
        request.ContentType = "application/json";

        // Encode the POST data into a byte array
        byte[] postData = Encoding.UTF8.GetBytes(data);

        // Set the POST data length
        request.ContentLength = postData.Length;

        // Write the POST data to the request stream
        using (var stream = request.GetRequestStream())
        {
            stream.Write(postData, 0, postData.Length);
        }

        // Send the POST request and wait for the response
        try
        {
            var response = (HttpWebResponse)request.GetResponse();

            // Check the status code
            if (response.StatusCode == HttpStatusCode.OK)
            {
                // Read the response data
                using (var reader = new StreamReader(response.GetResponseStream()))
                {
                    string responseString = reader.ReadToEnd();
                    Debug.Log("Res: " + responseString);
                    responseString = "{\"coordinates\":" + responseString + "}";
                    // Parse the response JSON into an array of strings
                    CoordinatesWrapper coordinates = JsonUtility.FromJson<CoordinatesWrapper>(responseString);
                    Debug.Log("Coordinates: " + coordinates);
                    // Process the coordinates
                    foreach (string coordinate in coordinates.coordinates)
                    {
                        Debug.Log("Coordinate: " + coordinate);
                    }
                }
            }
            else
            {
                Debug.LogError("Error sending POST request: " + response.StatusCode);
            }
        }
        catch (WebException ex)
        {
            Debug.LogError("Error sending POST request: " + ex.Message);
        }

        yield return 0;
    }
}

public struct FireSpreadItemRequestPayload
{
    public int coordinate;
    public string severity;
    public FireSpreadItemRequestPayload(int coordinate, string severity)
    {
        this.coordinate = coordinate;
        this.severity = severity;
    }

}

[Serializable]
public class CoordinatesWrapper
{
    public string[] coordinates;
}