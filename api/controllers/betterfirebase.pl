% Define incidents for different FireBehaviorGeneral types
incident(_,_,"Creeping").
incident(_,_,"Flanking").
incident(_,_,"Smoldering").
incident(_,_,"Running").
incident(_,_,"Torching").
incident(_,_,"Backing").
incident(_,_,"Uphill Runs").
incident(_,_,"Wind Driven Runs").
incident(_,_,"Long-range Spotting").
incident(_,_,"Spotting").
incident(_,_,"Isolated Torching").
incident(_,_,"Short-range Spotting").
incident(_,_,"Short Crown Runs").
incident(_,_,"Single Tree Torching").
incident(_,_,"Crowning").
incident(_,_,"Group Torching").

% Define Map coordinates for game map

gamemap(X) :- X >= 0, X =< 45.

% Rules to handle Creeping fire behavior and update X coordinates accordingly.
% Creeping affects the immediate adjacent cells horizontally and vertically.
%  - | - | - 
% -----------
%  - | X | - 
% -----------
%  - | - | - 
process_fire_behavior(X, XNew, "Creeping") :- XNew is X - 7, gamemap(XNew).
process_fire_behavior(X, XNew, "Creeping") :- XNew is X - 1, gamemap(XNew).
process_fire_behavior(X, XNew, "Creeping") :- XNew is X, gamemap(XNew).
process_fire_behavior(X, XNew, "Creeping") :- XNew is X + 1, gamemap(XNew).
process_fire_behavior(X, XNew, "Creeping") :- XNew is X + 7, gamemap(XNew).

% Rules to handle Flanking fire behavior, affecting horizontal cells.
%  - | - | - 
% -----------
%  X | X | X 
% -----------
%  - | - | - 
process_fire_behavior(X, XNew, "Flanking") :- XNew is X - 1, gamemap(XNew).
process_fire_behavior(X, XNew, "Flanking") :- XNew is X, gamemap(XNew).
process_fire_behavior(X, XNew, "Flanking") :- XNew is X + 1, gamemap(XNew).


% Rules to handle Smoldering fire behavior. It only affects the current cell.
%  - | - | - 
% -----------
%  - | X | - 
% -----------
%  - | - | - 
process_fire_behavior(X, XNew, "Smoldering") :- XNew is X, gamemap(XNew).

% Rules to handle Running fire behavior, affecting two cells upwards.
%  X | - | - 
% -----------
%  X | - | - 
% -----------
%  - | - | - 
process_fire_behavior(X, XNew, "Running") :- XNew is X - 14, gamemap(XNew).
process_fire_behavior(X, XNew, "Running") :- XNew is X - 7, gamemap(XNew).

% Rules to handle Group Torching, affecting the surrounding cells.
%  X | X | X 
% -----------
%  X | X | X 
% -----------
%  X | X | X 
process_fire_behavior(X, XNew, "Torching") :- XNew is X - 8, gamemap(XNew).
process_fire_behavior(X, XNew, "Torching") :- XNew is X - 7, gamemap(XNew).
process_fire_behavior(X, XNew, "Torching") :- XNew is X - 6, gamemap(XNew).
process_fire_behavior(X, XNew, "Torching") :- XNew is X - 1, gamemap(XNew).
process_fire_behavior(X, XNew, "Torching") :- XNew is X, gamemap(XNew).
process_fire_behavior(X, XNew, "Torching") :- XNew is X + 1, gamemap(XNew).
process_fire_behavior(X, XNew, "Torching") :- XNew is X + 6, gamemap(XNew).
process_fire_behavior(X, XNew, "Torching") :- XNew is X + 7, gamemap(XNew).
process_fire_behavior(X, XNew, "Torching") :- XNew is X + 8, gamemap(XNew).

% Rules to handle Backing fire behavior, affecting only the cell below the current cell.
%  - | - | - 
% -----------
%  - | X | - 
% -----------
%  - | X | - 

process_fire_behavior(X, XNew, "Backing") :- XNew is X, gamemap(XNew).
process_fire_behavior(X, XNew, "Backing") :- XNew is X+7, gamemap(XNew).


% Rules to handle Uphill Runs, affects the two cells upward diagonally.
%  X | - | X 
% -----------
%  - | X | - 
% -----------
%  - | - | - 
process_fire_behavior(X, XNew, "Uphill Runs") :- XNew is X - 8, gamemap(XNew).
process_fire_behavior(X, XNew, "Uphill Runs") :- XNew is X - 6, gamemap(XNew).
process_fire_behavior(X, XNew, "Uphill Runs") :- XNew is X, gamemap(XNew).

% Rules to handle Wind Driven Runs, affects three cells upwards.
%  X | X | X 
% -----------
%  - | X | - 
% -----------
%  - | - | - 
process_fire_behavior(X, XNew, "Wind Driven Runs") :- XNew is X - 8, gamemap(XNew).
process_fire_behavior(X, XNew, "Wind Driven Runs") :- XNew is X - 7, gamemap(XNew).
process_fire_behavior(X, XNew, "Wind Driven Runs") :- XNew is X - 6, gamemap(XNew).
process_fire_behavior(X, XNew, "Wind Driven Runs") :- XNew is X, gamemap(XNew).

% Rules to handle Spotting, affecting a distant cell above the current cell.
%  - | - | X 
%-----------
%  - | - | - 
%-----------
%  - | X | - 

process_fire_behavior(X, XNew, "Spotting") :- XNew is X-14, gamemap(XNew).

% Rules to handle Isolated Torching, affecting only the current cell.
%  - | - | - 
%-----------
%  - | X | - 
%-----------
%  - | - | - 

process_fire_behavior(X, XNew, "Isolated Torching") :- XNew is X, gamemap(XNew).

% Rules to handle Short-range Spotting, affecting two cells above the current cell.
%  - | X | - 
%-----------
%  - | X | - 
%-----------
%  - | - | - 

process_fire_behavior(X, XNew, "Short-range Spotting") :- XNew is X-7, gamemap(XNew).
process_fire_behavior(X, XNew, "Isolated Torching") :- XNew is X, gamemap(XNew).


% Rules to handle Short Crown Runs, affecting upper and same level cells.
%  X | X | - 
%-----------
%  X | - | - 
%-----------
%  - | - | - 

process_fire_behavior(X, XNew, "Short Crown Runs") :- XNew is X-7, gamemap(XNew).
process_fire_behavior(X, XNew, "Short Crown Runs") :- XNew is X-8, gamemap(XNew).
process_fire_behavior(X, XNew, "Short Crown Runs") :- XNew is X-1, gamemap(XNew).

% Rules to handle Single Tree Torching, affecting the cells immediately above and below.
%  X | - | - 
%-----------
%  - | - | - 
%-----------
%  - | - | - 

process_fire_behavior(X, XNew, "Single Tree Torching") :- XNew is X-8, gamemap(XNew).

% Rules to handle Crowning, affecting all surrounding cells.
%  X | X | X 
%-----------
%  X | - | X 
%-----------
%  X | X | X 

process_fire_behavior(X, XNew, "Crowning") :- XNew is X - 8, gamemap(XNew).
process_fire_behavior(X, XNew, "Crowning") :- XNew is X - 7, gamemap(XNew).
process_fire_behavior(X, XNew, "Crowning") :- XNew is X - 6, gamemap(XNew).
process_fire_behavior(X, XNew, "Crowning") :- XNew is X - 1, gamemap(XNew).
process_fire_behavior(X, XNew, "Crowning") :- XNew is X + 1, gamemap(XNew).
process_fire_behavior(X, XNew, "Crowning") :- XNew is X + 6, gamemap(XNew).
process_fire_behavior(X, XNew, "Crowning") :- XNew is X + 7, gamemap(XNew).
process_fire_behavior(X, XNew, "Crowning") :- XNew is X + 8, gamemap(XNew).


% Rules to handle Group Torching, affecting a group of cells above.
%  X | X | X 
%-----------
%  - | X | - 
%-----------
%  - | - | - 

process_fire_behavior(X, XNew, "Group Torching") :- XNew is X-7, gamemap(XNew).
process_fire_behavior(X, XNew, "Group Torching") :- XNew is X-8, gamemap(XNew).
process_fire_behavior(X, XNew, "Group Torching") :- XNew is X-6, gamemap(XNew).


% Rule to calculate new X coordinates based on FireBehaviorGeneral attributes
calculate_new_coordinates(X, XNew, FireBehaviorGeneral) :- 
    incident(X, _, FireBehaviorGeneral),
    process_fire_behavior(X, XNew, FireBehaviorGeneral).