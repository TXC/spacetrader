import { Fragment } from 'react'
import type { Game } from '../game/Game.ts'
import type { News as NewsRules } from '../game/News.ts'
import { Icon } from './Icon.tsx'
import { LoggedCheckbox, LoggedLink } from './Logged.tsx'
import { useSession } from './useStore.ts'

type Props = { game: Game, news: NewsRules }

function PayLink({ news }: { news: NewsRules }) {
  return (
    <div className="button-item">
      <LoggedLink id="purchaseNews" onPress={() => news.buy()}>
        <Icon name="News" className="button-icon" />
        <span>{`Pay $${news.price()} to read news`}</span>
      </LoggedLink>
    </div>
  )
}

// The masthead, then each headline with a blank line between.
function Paper({ masthead, text }: { masthead: string, text: string }) {
  return (
    <>
      <h4>{masthead}</h4>
      <br />
      {text.split('\n').map((line, index) => <Fragment key={index}>{index > 0 && <><br /><br /></>}{line}</Fragment>)}
    </>
  )
}

export function News({ game, news }: Props) {
  useSession()
  const text = news.text()
  return (
    <>
      <h1 className="centered-div news-header">News</h1>
      <br />
      <div id="newsStrDiv">{text === null ? <PayLink news={news} /> : <Paper masthead={news.masthead()} text={text} />}</div>
      <br />
      <div className="centered-div">
        <LoggedCheckbox id="autoNewsCheckbox" checked={game.autoNews} onToggle={(on) => news.setAuto(on)}>Automatically buy newspaper</LoggedCheckbox>
      </div>
    </>
  )
}
