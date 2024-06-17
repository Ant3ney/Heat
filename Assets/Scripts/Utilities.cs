using System.Collections;
using System.Collections.Generic;
using UnityEngine;
//using System;
using System.Linq;

public static class Utilities
{
    public static int[] getAdjacentCoordinates(int center)
    {
        if (center > 44 || center < 1)
        {
            return new int[] { 0, 0, 0, 0, 0, 0, 0, 0 };
        }
        int[][] spreadOptions = new int[][]
        {
                /* new int[] {north, south, east, west, northwest, northeast, southwest, southeast} */
                new int[] {0, 5, 2, 0, 0, 0, 0, 6}, // coordinate 1
                new int[] {0, 6, 3, 1, 0, 0, 5, 7}, // coordinate 2
                new int[] {0, 7, 4, 2, 0, 0, 6, 8}, // coordinate 3
                new int[] {0, 8, 0, 3, 0, 0, 7, 0}, // coordinate 4
                new int[] {1, 9, 6, 0, 0, 2, 0, 10}, // coordinate 5
                new int[] {2, 10, 7, 5, 1, 3, 9, 11}, // coordinate 6
                new int[] {3, 11, 8, 6, 2, 4, 10, 12}, // coordinate 7
                new int[] {4, 12, 0, 7, 2, 0, 11, 0}, // coordinate 8
                new int[] {5, 13, 10, 0, 0, 6, 0, 14}, // coordinate 9
                new int[] {6, 14, 11, 9, 5, 7, 13, 15}, // coordinate 10
                new int[] {7, 15, 12, 10, 6, 8, 14, 16}, // coordinate 11
                new int[] {8, 16, 0, 11, 7, 0, 15, 0}, // coordinate 12
                new int[] {9, 0, 14, 0, 0, 10, 0, 18}, // coordinate 13
                new int[] {10, 18, 15, 13, 9, 11, 0, 19}, // coordinate 14
                new int[] {11, 19, 16, 14, 10, 12, 18, 20}, // coordinate 15
                new int[] {12, 20, 17, 15, 11, 0, 19, 21}, // coordinate 16
                new int[] {0, 26, 0, 16, 12, 0, 20, 22}, // coordinate 17
                new int[] {14, 23, 19, 0, 13, 15, 0, 24}, // coordinate 18
                new int[] {15, 24, 20, 18, 14, 16, 23, 25}, // coordinate 19
                new int[] {16, 25, 21, 19, 15, 17, 24, 26}, // coordinate 20
                new int[] {17, 26, 22, 20, 16, 0, 25, 27}, // coordinate 21
                new int[] {0, 27, 0, 21, 17, 0, 26, 28}, // coordinate 22
                new int[] {18, 0, 24, 0, 0, 19, 0, 29}, // coordinate 23
                new int[] {19, 29, 25, 23, 18, 20, 0, 30}, // coordinate 24
                new int[] {20, 30, 26, 24, 19, 21, 29, 31}, // coordinate 25
                new int[] {21, 31, 27, 25, 20, 22, 30, 32}, // coordinate 26
                new int[] {22, 32, 28, 26, 21, 0, 31, 33}, // coordinate 27
                new int[] {0, 33, 0, 27, 22, 0, 32, 34}, // coordinate 28
                new int[] {24, 35, 30, 0, 32, 25, 0, 36}, // coordinate 29
                new int[] {25, 36, 31, 29, 24, 26, 35, 37}, // coordinate 30
                new int[] {26, 37, 32, 30, 25, 27, 36, 38}, // coordinate 31
                new int[] {27, 38, 33, 31, 26, 28, 37, 39}, // coordinate 32
                new int[] {28, 39, 34, 32, 27, 00, 38, 40}, // coordinate 33
                new int[] {0, 40, 0, 33, 28, 0, 39, 0}, // coordinate 34
                new int[] {29, 0, 36, 0, 0, 30, 0, 0}, // coordinate 35
                new int[] {30, 0, 37, 35, 29, 31, 0, 41}, // coordinate 36
                new int[] {31, 41, 38, 36, 30, 32, 0, 42}, // coordinate 37
                new int[] {32, 42, 39, 37, 31, 33, 41, 43}, // coordinate 38
                new int[] {33, 43, 40, 38, 32, 34, 42, 44}, // coordinate 39
                new int[] {34, 44, 0, 39, 33, 0, 43, 0}, // coordinate 40
                new int[] {37, 0, 42, 0, 36, 38, 0, 0}, // coordinate 41
                new int[] {38, 0, 43, 41, 37, 39, 0, 0}, // coordinate 42
                new int[] {39, 0, 44, 42, 38, 40, 0, 0}, // coordinate 43
                new int[] {40, 0, 0, 43, 39, 0, 0, 0}  // coordinate 44
        };

        return spreadOptions[center - 1];
    }

    public static int GenerateSeverityIndex()
    {
        System.Random random = new System.Random();

        // Generates a number between 1 and 100
        int randomNumber = random.Next(1, 101);

        if (randomNumber <= 10)
        {
            // 10%
            return random.Next(9, 14);
        }
        else if (randomNumber <= 40)
        {
            // Additional 30%
            return random.Next(5, 9);
        }
        else
        {
            // Remaining 60%
            return random.Next(0, 5);
        }
    }

    public static string indexToSeverity(int index)
    {
        string[] severityOptions = new string[]
        {
            "Creeping",
            "Smoldering",
            "IsolatedTorching",
            "Backing",
            "SingleTreeTorching",
            "Flanking", // XX
            "Running",
            "UphillRuns",
            "Spotting",
            "WindDrivenRuns", // XXX 
            "Torching",
            "ShortCrownRuns",
            "Crowning",
            "GroupTorching",
        };

        return severityOptions[index];
    }

    public static string[] getFireSpreadCoordinates(List<FireSpreadItemRequestPayload> fireSpreadItems)
    {
        string[] allSpreadCoordinates = new string[] { };
        foreach (FireSpreadItemRequestPayload item in fireSpreadItems)
        {
            string severity = item.severity;
            int coordinate = item.coordinate;
            string[] spreadCoordinates = getFireSpreadCoordinatesFromMin(severity, coordinate);
            // concatenate the arrays but remove duplicates
            allSpreadCoordinates = allSpreadCoordinates.Concat(spreadCoordinates).Distinct().ToArray();
        }

        return allSpreadCoordinates;
    }

    public static string[] getFireSpreadCoordinatesFromMin(string severity, int coordinate)
    {
        int[] adjacentCoordinates = getAdjacentCoordinates(coordinate);
        int windDirectionIndex = Random.Range(0, 8);
        int windCoordinate = adjacentCoordinates[windDirectionIndex];

        int n = adjacentCoordinates[0];
        int s = adjacentCoordinates[1];
        int e = adjacentCoordinates[2];
        int w = adjacentCoordinates[3];
        int nw = adjacentCoordinates[4];
        int ne = adjacentCoordinates[5];
        int sw = adjacentCoordinates[6];
        int se = adjacentCoordinates[7];

        switch (severity)
        {
            case "Creeping":
                return intArrayToStringArray(new int[] { windCoordinate });
            case "Smoldering":
                return intArrayToStringArray(new int[] { w, nw });
            case "IsolatedTorching":
                return intArrayToStringArray(new int[] { windCoordinate });
            case "Backing":
                return intArrayToStringArray(new int[] { s });
            case "SingleTreeTorching":
                return intArrayToStringArray(new int[] { nw });
            case "Flanking":
                return intArrayToStringArray(new int[] { w, e });
            case "Running":
                return intArrayToStringArray(new int[] { nw, w });
            case "UphillRuns":
                return intArrayToStringArray(new int[] { nw, ne });
            case "Spotting":
                return intArrayToStringArray(new int[] { s, ne });
            case "WindDrivenRuns":
                return intArrayToStringArray(new int[] { nw, n, ne });
            case "Torching":
                return intArrayToStringArray(new int[] { n, s, e, w, nw, ne, sw, se });
            case "ShortCrownRuns":
                return intArrayToStringArray(new int[] { w, n, nw });
            case "Crowning":
                return intArrayToStringArray(new int[] { n, s, e, w, nw, ne, sw, se });
            case "GroupTorching":
                return intArrayToStringArray(new int[] { nw, n, ne });
            default: return new string[0];
        }
    }

    public static string getSeverity()
    {
        return indexToSeverity(GenerateSeverityIndex());
    }

    public static string[] intArrayToStringArray(int[] intArray)
    {
        string[] stringArray = new string[intArray.Length];
        for (int i = 0; i < intArray.Length; i++)
        {
            stringArray[i] = intArray[i].ToString();
        }
        return stringArray;
    }

    public static List<int> convertIntArrayToList(int[] intArray)
    {
        List<int> intList = new List<int>();
        for (int i = 0; i < intArray.Length; i++)
        {
            intList.Add(intArray[i]);
        }
        return intList;
    }
}

