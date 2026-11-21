import styles from './StateTree.module.css';

// A value shown as a tree: objects and lists are branches that open and close, anything
// else is one line in JSON, so text and numbers look different. Numbers are written as
// they are, since JSON would turn NaN into null. The browser keeps which
// branches are open, so they stay open when the value changes.
export function StateTree({ name, value }: { name: string; value: unknown }) {
  if (value === null || typeof value !== 'object' || value instanceof Date) {
    return (
      <div className={styles.leaf}>
        {name}: {typeof value === 'number' ? String(value) : (JSON.stringify(value) ?? 'undefined')}
      </div>
    );
  }
  return (
    <details className={styles.branch}>
      <summary>{Array.isArray(value) ? `${name} [${value.length}]` : name}</summary>
      {Object.entries(value as Record<string, unknown>).map(([key, entry]) => (
        <StateTree key={key} name={key} value={entry} />
      ))}
    </details>
  );
}
