import styles from './StateTree.module.css';

// A value shown as a tree: objects and lists are branches that open and close, anything
// else is one line in JSON, so text and numbers look different. The browser keeps which
// branches are open, so they stay open when the value changes.
export function StateTree({ name, value }: { name: string; value: unknown }) {
  if (value === null || typeof value !== 'object') {
    return (
      <div className={styles.leaf}>
        {name}: {JSON.stringify(value) ?? 'undefined'}
      </div>
    );
  }
  return (
    <details className={styles.branch}>
      <summary>{Array.isArray(value) ? `${name} [${value.length}]` : name}</summary>
      {Object.entries(value).map(([key, entry]) => (
        <StateTree key={key} name={key} value={entry} />
      ))}
    </details>
  );
}
