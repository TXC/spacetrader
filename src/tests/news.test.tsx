import { StrictMode } from 'react';
import { expect, test } from 'vitest';
import { News as NewsRules } from '../game/News.ts';
import { runtime } from '../game/runtime.ts';
import { News } from '../ui/News.tsx';
import './flows/setup.ts';
import { runReplayLog } from './flows/harness.ts';
import { render } from './support/render.tsx';

// React draws twice in development. Buying the paper and making up the headlines must not
// happen while drawing, or they would happen twice.
test('drawing the news spends nothing and draws no random numbers', () => {
  const log = '{"idLog":["createCommander"],"eventNameLog":["click"],"gameRandSeed":1733543535142}';
  const game = runReplayLog(log).session.game!;
  game.autoNews = true;
  const creditsBefore = game.commander.credits;
  const news = new NewsRules(game);

  news.present();
  const creditsAfterOpening = game.commander.credits;
  const drawsAfterOpening = runtime.gameRand._numInvocations;
  const { host } = render(
    <StrictMode>
      <News game={game} news={news} />
    </StrictMode>
  );

  expect(creditsAfterOpening).toBe(creditsBefore - news.price());
  expect(game.commander.credits).toBe(creditsAfterOpening);
  expect(runtime.gameRand._numInvocations).toBe(drawsAfterOpening);
  expect(host.querySelector('#newsStrDiv h4')?.textContent).toBe(news.masthead());
});
