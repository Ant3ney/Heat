# Querying Fire Spread Prediction

The query function takes a JSON object containing an array of fires as input and returns an array of coordinates indicating where the fires are predicted to spread.

## Example Usage

### Request

Request to... https://heat.singularitydevelopment.com/ai/query

example body...

```json
{
  "fires": [
    {
      "center": 32,
      "severity": "Crowning"
    },
    {
      "center": 5.904243,
      "severity": "Backing"
    }
  ]
}
```

### Response

```json
["32.882085,-117.143933", "32.904243,-117.166443"]
```

### Severity Options

```json
[
  "Flanking",
  "Smoldering",
  "Running",
  "Torching",
  "Backing",
  "UphillRuns",
  "WindDrivenRuns",
  "Spotting",
  "IsolatedTorching",
  "ShortrangeSpotting",
  "ShortCrownRuns",
  "SingleTreeTorching",
  "Crowning",
  "GroupTorching"
]
```

## Error Handling

If the `fires` parameter is missing, the function will return a 400 status code and the message "Missing parameters".

If an error occurs during processing, the function will return a 500 status code and the message "Something went wrong".

## Note

The `query` function is implemented in the `aiController.js` file and utilizes the `getCoordinates` function from the `utilities.js` file.

### Notes

14 total
4 intense
3 moderate
7 small
