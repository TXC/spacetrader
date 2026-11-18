import type { CrewMember } from '../game/CrewMember.ts';
import type { Game } from '../game/Game.ts';
import { canHire, fire, hire, rosterSections } from '../game/Roster.ts';
import type { RosterKind, RosterSection } from '../game/Roster.ts';
import { Icon } from './Icon.tsx';
import { LoggedButton } from './Logged.tsx';
import { useSession } from './useStore.ts';
import styles from './Roster.module.css';
import shared from './shared.module.css';

type Props = { game: Game; onFired?: (member: CrewMember) => void };

const ICONS: Record<RosterKind, string> = {
  commander: 'commander',
  crew: 'roster',
  forHire: 'forhire',
};

function Skills({ member }: { member: CrewMember }) {
  return (
    <table className={styles.skills}>
      <tbody>
        <tr>
          <td>Pilot</td>
          <td>{member.pilot}</td>
        </tr>
        <tr>
          <td>Fighter</td>
          <td>{member.fighter}</td>
        </tr>
        <tr>
          <td>Trader</td>
          <td>{member.trader}</td>
        </tr>
        <tr>
          <td>Engineer</td>
          <td>{member.engineer}</td>
        </tr>
      </tbody>
    </table>
  );
}

function HireFire({
  game,
  kind,
  member,
  onFired,
}: Props & { kind: RosterKind; member: CrewMember }) {
  const firing = kind === 'crew';
  const press = () => (firing ? fire(game, member, onFired) : hire(game, member));
  return (
    <LoggedButton
      id={'hireFire_' + member.name}
      label={firing ? 'Fire' : 'Hire'}
      disabled={!firing && !canHire(game)}
      onPress={press}
    />
  );
}

function MemberRow({
  game,
  kind,
  member,
  onFired,
}: Props & { kind: RosterKind; member: CrewMember }) {
  const priced = kind !== 'commander' && !member.forQuest;
  const name = priced ? `${member.name} ($${member.hirePrice()}/day)` : member.name;
  return (
    <tr id={`personnelRow-${member.name}`}>
      <td>
        <div>
          <Icon name={ICONS[kind]} className={styles.memberIcon} />
          {name}
          {!member.forQuest && <Skills member={member} />}
        </div>
      </td>
      <td className={shared.centredText}>
        {priced && <HireFire game={game} kind={kind} member={member} onFired={onFired} />}
      </td>
    </tr>
  );
}

// A row for a slot nobody is in, or for a section with no slots at all.
function EmptyRow({ label, icon }: { label: string; icon: string }) {
  return (
    <tr>
      <td colSpan={2}>
        <div>
          <Icon name={icon} className={styles.slotIcon} />
          {label}
        </div>
      </td>
    </tr>
  );
}

function Section({ game, section, onFired }: Props & { section: RosterSection }) {
  const vacancies = Math.max(0, section.slots - section.members.length);
  return (
    <>
      <tr>
        <th colSpan={2} className={shared.sectionTitle}>
          {section.title}
        </th>
      </tr>
      {section.slots === 0 && <EmptyRow label="None" icon="noslots" />}
      {section.slots > 0 &&
        section.members.map(member => (
          <MemberRow
            key={member.name}
            game={game}
            kind={section.kind}
            member={member}
            onFired={onFired}
          />
        ))}
      {section.slots > 0 &&
        Array.from({ length: vacancies }, (_, index) => (
          <EmptyRow key={index} label="Vacancy" icon="empty" />
        ))}
    </>
  );
}

export function Roster({ game, onFired }: Props) {
  useSession();
  return (
    <>
      <h1>Personnel Roster</h1>
      <table className={shared.joinedTable}>
        <tbody>
          {rosterSections(game).map(section => (
            <Section key={section.kind} game={game} section={section} onFired={onFired} />
          ))}
        </tbody>
      </table>
    </>
  );
}
