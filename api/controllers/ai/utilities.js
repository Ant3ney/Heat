const pl = require("tau-prolog");

function consultSession(session) {
  return new Promise((res) => {
    session.consult(__dirname + "/betterfirebase.pl", {
      success: res,
      error: (err) => {
        res(err);
      },
    });
  });
}

function querySession(session, query) {
  return new Promise((res) => {
    session.query(query, {
      success: res,
      error: (err) => {
        res(err);
      },
    });
  });
}

function answerSession(session) {
  return new Promise((res) => {
    session.answer({
      success: (answer) => {
        res(session.format_answer(answer));
      },
      error: (err) => {
        res({ err, out: true });
      },
      fail: (err) => {
        res({ err, out: true });
      },
      limit: (err) => {
        res({ err, out: true });
      },
    });
  });
}

async function getCoordinates(fires) {
  const coordinates = [];
  // consult session
  const session = pl.create();
  const consult = await consultSession(session);
  // loop though fires
  for (let i = 0; i < fires.length; i++) {
    const fire = fires[i];
    // extract center
    const { center } = fire;
    // extract severity
    const { severity } = fire;
    // query session
    const query = `process_fire_behavior(${center}, XNew, ${severity}).`;
    const queryRes = await querySession(session, query);
    // answer session while its answer.out is true
    let answerRes = await answerSession(session);
    console.log("answerRes:", answerRes);

    while (!answerRes.out) {
      console.log("answerRes:", answerRes);
      //answerRes: XNew = 1, Backing = [C,r,e,e,p,i,n,g]
      //answerRes: XNew = 8, Backing = [B,a,c,k,i,n,g]
      const formattedSeverity = formatSeverity(severity);
      if (answerRes.indexOf(formattedSeverity) !== -1)
        coordinates.push(answerRes.split(`, ${severity}`)[0].split(" = ")[1]);
      answerRes = await answerSession(session);
    }
  }
  // remove duplicates
  const uniqueCoordinates = [...new Set(coordinates)];
  return uniqueCoordinates;
}

function formatSeverity(severity) {
  /* 
    types of fires:    
    Flanking
    Smoldering
    Running
    Torching
    Backing
    UphillRuns
    WindDrivenRuns
    Spotting
    IsolatedTorching
    ShortrangeSpotting
    ShortCrownRuns
    SingleTreeTorching
    Crowning
    GroupTorching 
*/
  switch (severity) {
    case "Backing":
      return "[B,a,c,k,i,n,g]";
    case "Flanking":
      return "[F,l,a,n,k,i,n,g]";
    case "Running":
      return "[R,u,n,n,i,n,g]";
    case "Torching":
      return "[T,o,r,c,h,i,n,g]";
    case "UphillRuns":
      return "[U,p,h,i,l,l, ,R,u,n,s]";
    case "WindDrivenRuns":
      return "[W,i,n,d, ,D,r,i,v,e,n, ,R,u,n,s]";
    case "Spotting":
      return "[S,p,o,t,t,i,n,g]";
    case "IsolatedTorching":
      return "[I,s,o,l,a,t,e,d, ,T,o,r,c,h,i,n,g]";
    case "ShortrangeSpotting":
      return "[S,h,o,r,t,-,r,a,n,g,e, ,S,p,o,t,t,i,n,g]";
    case "ShortCrownRuns":
      return "[S,h,o,r,t, ,C,r,o,w,n, ,R,u,n,s]";
    case "SingleTreeTorching":
      return "[S,i,n,g,l,e, ,T,r,e,e, ,T,o,r,c,h,i,n,g]";
    case "Crowning":
      return "[C,r,o,w,n,i,n,g]";
    case "GroupTorching":
      return "[G,r,o,u,p, ,T,o,r,c,h,i,n,g]";
    case "Smoldering":
      return "[S,m,o,l,d,e,r,i,n,g]";
    case "Creeping":
      return "[C,r,e,e,p,i,n,g]";
    default:
      return severity;
  }
}

module.exports = {
  getCoordinates,
  consultSession,
  querySession,
  answerSession,
};
