// @ts-nocheck
// The cheat buttons shown in debug mode. Moved out of the utilities so the rules no longer
// import each other in a circle; becomes a React component with the rest of the root.
import { ReputationScore } from '../game/Commander.ts'
import { RareEvent } from '../game/Game.ts'
import { Utils } from '../game/Utilities.ts'
import { runtime } from '../game/runtime.ts'

export function installCheats(div, sTG) {
  div.innerHTML = ''

  const moneyButton = document.createElement('button');
  moneyButton.innerText = "Free Money"
  moneyButton.id = "cheat_freeMoney"

  runtime.actionLog.registerButtonEventListener(moneyButton, 'click', () => {
      if (!sTG) { return }
      if (!sTG.viewController) { return }
      if (!sTG.viewController._game) { return }
      if (!sTG.viewController._game.commander) { return }

      const commander = sTG.viewController._game.commander
      commander.credits = 1000000
  });

  div.appendChild(moneyButton);


  const singularityButton = document.createElement('button');
  singularityButton.innerText = "Free Singularity"
  singularityButton.id = "cheat_freeSingularity"

  runtime.actionLog.registerButtonEventListener(singularityButton, 'click', () => {
      sTG.viewController._game.canSuperWarp = true
  });

  div.appendChild(singularityButton);


  const specialButton = document.createElement('button');
  specialButton.innerText = "Show Special"
  specialButton.id = "cheat_showSpecial"

  runtime.actionLog.registerButtonEventListener(specialButton, 'click', () => {
      sTG.viewController._game.showSpecialSystems = true
  });

  div.appendChild(specialButton);


  {
    const b = document.createElement('button');
    b.innerText = "Average reputationScore"
    b.id = "cheat_averageReputation"

    runtime.actionLog.registerButtonEventListener(b, 'click', () => {
        sTG.viewController._game.commander.reputationScore = ReputationScore.Average
    });

    div.appendChild(b);
  }

  {
    const b = document.createElement('button');
    b.innerText = "Fighter 15"
    b.id = "cheat_fighter15"

    runtime.actionLog.registerButtonEventListener(b, 'click', () => {
        sTG.viewController._game.commander.fighter = 15
    });

    div.appendChild(b);
  }



  const rareEvents = [
    "Marie Celeste",
    "Captain Ahab",
    "Captain Conrad",
    "Captain Huie",
    "Old Bottle",
    "Good Bottle",
  ]

  for (let rareEvent = 0; rareEvent < RareEvent.Count; rareEvent++) {
    const eventButton = document.createElement('button');
    eventButton.innerText = "Encounter " + rareEvents[rareEvent]
    eventButton.id = "cheat_" + Utils.sanitizedElementID(eventButton.innerText)

    runtime.actionLog.registerButtonEventListener(eventButton, 'click', () => {
      sTG.viewController._game.forceRareEvent = true
      // Note: this overwrites pending rare events
      sTG.viewController._game._remainingRareEvents = [ rareEvent ]
    });

    div.appendChild(eventButton);
  }
}
