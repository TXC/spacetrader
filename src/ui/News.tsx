import type { Game } from '../game/Game.ts';
import type { News as NewsRules } from '../game/News.ts';
import { Icon } from './Icon.tsx';
import { LoggedCheckbox, LoggedLink } from './Logged.tsx';
import { useSession } from './useStore.ts';
import styles from './News.module.css';
import shared from './shared.module.css';

type Props = { game: Game; news: NewsRules };

function PayLink({ news }: { news: NewsRules }) {
  return (
    <div>
      <LoggedLink id="purchaseNews" onPress={() => news.buy()}>
        <Icon name="News" className={shared.buttonIcon} />
        <span>{`Pay $${news.price()} to read news`}</span>
      </LoggedLink>
    </div>
  );
}

// The masthead, then each headline as a paragraph of its own.
function Paper({ masthead, text }: { masthead: string; text: string }) {
  return (
    <>
      <h4>{masthead}</h4>
      {text.split('\n').map((line, index) => (
        <p key={index}>{line}</p>
      ))}
    </>
  );
}

export function News({ game, news }: Props) {
  useSession();
  const text = news.text();
  return (
    <>
      <h1 className={styles.heading}>News</h1>
      <div id="newsStrDiv" className={styles.paper}>
        {text === null ? <PayLink news={news} /> : <Paper masthead={news.masthead()} text={text} />}
      </div>
      <div className={shared.centredBlock}>
        <LoggedCheckbox
          id="autoNewsCheckbox"
          checked={game.autoNews}
          onToggle={on => news.setAuto(on)}
        >
          Automatically buy newspaper
        </LoggedCheckbox>
      </div>
    </>
  );
}
