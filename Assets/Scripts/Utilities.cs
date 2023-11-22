using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public static class Utilities
{
    public static int[] getAdjacentCoordinates(int center)
    {
        if (center > 44 || center < 1)
        {
            return new int[] { 0, 0, 0, 0 };
        }
        int[][] spreadOptions = new int[][]
        {
                /* new int[] {north, south, east, west} */
                new int[] {0, 5, 2, 0}, // coordinate 1
                new int[] {0, 6, 3, 1}, // coordinate 2
                new int[] {0, 7, 4, 2}, // coordinate 3
                new int[] {0, 8, 0, 3}, // coordinate 4
                new int[] {1, 9, 6, 0}, // coordinate 5
                new int[] {2, 10, 7, 5}, // coordinate 6
                new int[] {3, 11, 8, 6}, // coordinate 7
                new int[] {4, 12, 0, 7}, // coordinate 8
                new int[] {5, 13, 10, 0}, // coordinate 9
                new int[] {6, 14, 11, 9}, // coordinate 10
                new int[] {7, 15, 12, 10}, // coordinate 11
                new int[] {8, 16, 0, 11}, // coordinate 12
                new int[] {9, 0, 14, 0}, // coordinate 13
                new int[] {10, 18, 15, 13}, // coordinate 14
                new int[] {11, 19, 16, 14}, // coordinate 15
                new int[] {12, 20, 17, 15}, // coordinate 16
                new int[] {0, 26, 0, 16}, // coordinate 17
                new int[] {14, 23, 19, 0}, // coordinate 18
                new int[] {15, 24, 20, 18}, // coordinate 19
                new int[] {16, 25, 21, 19}, // coordinate 20
                new int[] {17, 26, 22, 20}, // coordinate 21
                new int[] {0, 27, 0, 21}, // coordinate 22
                new int[] {18, 0, 24, 0}, // coordinate 23
                new int[] {19, 29, 25, 23}, // coordinate 24
                new int[] {20, 30, 26, 24}, // coordinate 25
                new int[] {21, 31, 27, 25}, // coordinate 26
                new int[] {22, 32, 28, 26}, // coordinate 27
                new int[] {0, 33, 0, 27}, // coordinate 28
                new int[] {24, 35, 30, 0}, // coordinate 29
                new int[] {25, 36, 31, 29}, // coordinate 30
                new int[] {26, 37, 32, 30}, // coordinate 31
                new int[] {27, 38, 33, 31}, // coordinate 32
                new int[] {28, 39, 34, 32}, // coordinate 33
                new int[] {0, 40, 0, 33}, // coordinate 34
                new int[] {29, 0, 36, 0}, // coordinate 35
                new int[] {30, 0, 37, 35}, // coordinate 36
                new int[] {31, 41, 38, 36}, // coordinate 37
                new int[] {32, 42, 39, 37}, // coordinate 38
                new int[] {33, 43, 40, 38}, // coordinate 39
                new int[] {34, 44, 0, 39}, // coordinate 40
                new int[] {37, 0, 42, 0}, // coordinate 41
                new int[] {38, 0, 43, 41}, // coordinate 42
                new int[] {39, 0, 44, 42}, // coordinate 43
                new int[] {40, 0, 0, 43}  // coordinate 44
        };

        return spreadOptions[center - 1];
    }

    /* public static int GenerateSeverityIndex()
    {
        Random random = new Random();

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
    }

    public static string getSeverity()
    {

    } */
}

