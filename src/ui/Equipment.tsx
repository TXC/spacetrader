import { buyEquipment, offers, sellEquipment, slotSections } from '../game/Equipment.ts';
import type { Installed, Offer, SlotSection } from '../game/Equipment.ts';
import type { Game } from '../game/Game.ts';
import { BaysCredits } from './BaysCredits.tsx';
import { Icon } from './Icon.tsx';
import { LoggedButton } from './Logged.tsx';
import { useSession } from './useStore.ts';
import shared from './shared.module.css';

type GameProps = { game: Game };

function Named({ name }: { name: string }) {
  return (
    <>
      <Icon name={name} className={shared.rowIcon} />
      <span>{name}</span>
    </>
  );
}

// A row that only says the slot is empty, or that the ship has none.
function PlaceholderRow({ label }: { label: string }) {
  return (
    <tr>
      <td colSpan={2}>
        <Named name={label} />
      </td>
    </tr>
  );
}

function InstalledRow({ game, item }: GameProps & { item: Installed }) {
  const sell = () => sellEquipment(game, item.type, item.value);
  return (
    <tr>
      <td>
        <Named name={item.name} />
      </td>
      {item.value === 0 ? (
        <td />
      ) : (
        <td className={shared.centredText}>
          <LoggedButton id={'sell_' + item.name} label={`Sell for $${item.value}`} onPress={sell} />
        </td>
      )}
    </tr>
  );
}

function Section({ game, section }: GameProps & { section: SlotSection }) {
  return (
    <>
      <tr>
        <th colSpan={2} className={shared.sectionTitle}>
          {section.title}
        </th>
      </tr>
      {section.slots === 0 && <PlaceholderRow label="No slots" />}
      {section.slots > 0 &&
        section.installed.map((item, index) => (
          <InstalledRow key={index} game={game} item={item} />
        ))}
      {section.slots > 0 &&
        Array.from({ length: section.empty }, (_, index) => (
          <PlaceholderRow key={'empty' + index} label="Empty" />
        ))}
    </>
  );
}

function OfferRow({ game, offer }: GameProps & { offer: Offer }) {
  const available = offer.price > 0;
  return (
    <tr>
      <td>
        <Named name={offer.name} />
      </td>
      <td className={available ? shared.right : shared.centredText}>
        {available ? `$${offer.price}` : 'unavailable'}
      </td>
      <td className={shared.centredText}>
        <LoggedButton
          id={'buy_' + offer.name}
          label="Buy"
          disabled={!offer.enabled}
          onPress={() => buyEquipment(game, offer.type, offer.price)}
        />
      </td>
    </tr>
  );
}

export function Equipment({ game }: GameProps) {
  useSession();
  return (
    <>
      <h4>Ship Equipment Slots</h4>
      <table className={shared.joinedTable}>
        <tbody>
          {slotSections(game).map(section => (
            <Section key={section.title} game={game} section={section} />
          ))}
        </tbody>
      </table>
      <BaysCredits game={game} />
      <br />
      <h4>Buy Equipment</h4>
      <table className={shared.tightTable}>
        <tbody>
          {offers(game).map(offer => (
            <OfferRow key={offer.type} game={game} offer={offer} />
          ))}
        </tbody>
      </table>
    </>
  );
}
