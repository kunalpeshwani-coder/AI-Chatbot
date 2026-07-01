import React, { useState, useEffect } from 'react';
import {
    getDatabaseConnections, testDatabaseConnection, createDatabaseConnection,
    syncDatabaseConnection, deleteDatabaseConnection, getAvailableTables, addDatabaseTables,
} from '../../api';

const EMPTY_FORM = { driver: 'mysql', host: '', port: '3306', database: '', username: '', password: '' };

const DEFAULT_PORTS = {
    mysql: '3306', mariadb: '3306', pgsql: '5432', sqlsrv: '1433', oci: '1521', sqlite: '', mongodb: '27017',
};

const DRIVER_OPTIONS = [
    { value: 'mysql',   label: 'MySQL' },
    { value: 'mariadb', label: 'MariaDB' },
    { value: 'pgsql',   label: 'PostgreSQL' },
    { value: 'sqlsrv',  label: 'SQL Server' },
    { value: 'oci',     label: 'Oracle' },
    { value: 'sqlite',  label: 'SQLite (file)' },
    { value: 'mongodb', label: 'MongoDB' },
];

const STATUS_STYLES = {
    connected: 'text-emerald-400',
    pending:   'text-yellow-400',
    failed:    'text-red-400',
};

export default function DatabaseConnect({ chatbot, onUpdate }) {
    const [connections, setConnections] = useState([]);
    const [loading, setLoading]         = useState(true);
    const [form, setForm]               = useState(EMPTY_FORM);
    const [credentialsFieldKey, setCredentialsFieldKey] = useState(0);
    const [pendingCredentials, setPendingCredentials] = useState(null);
    const [tables, setTables]           = useState(null);
    const [selectedTables, setSelected] = useState([]);
    const [excludedColumns, setExcludedColumns] = useState({});
    const [expandedTable, setExpandedTable] = useState(null);
    const [testing, setTesting]         = useState(false);
    const [saving, setSaving]           = useState(false);
    const [error, setError]             = useState(null);
    const [syncingId, setSyncingId]     = useState(null);
    const [addingTablesFor, setAddingTablesFor] = useState(null);
    const [moreTables, setMoreTables]   = useState(null);
    const [moreSelected, setMoreSelected] = useState([]);
    const [moreExcludedColumns, setMoreExcludedColumns] = useState({});
    const [moreExpandedTable, setMoreExpandedTable] = useState(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [savingMore, setSavingMore]   = useState(false);
    const [moreError, setMoreError]     = useState(null);

    useEffect(() => {
        if (!chatbot?.id) return;
        getDatabaseConnections(chatbot.id).then(setConnections).finally(() => setLoading(false));
    }, [chatbot?.id]);

    const isFileBased = form.driver === 'sqlite';

    const handleDriverChange = (driver) => {
        setForm(f => ({ ...f, driver, port: DEFAULT_PORTS[driver] ?? '' }));
    };

    const handleTest = async (e) => {
        e.preventDefault();
        setTesting(true);
        setError(null);
        setTables(null);
        setSelected([]);
        setExcludedColumns({});
        const credentials = { ...form, port: Number(form.port) };
        try {
            const { tables } = await testDatabaseConnection(chatbot.id, credentials);
            setTables(tables);
            setSelected(tables.map(t => t.name));
            setPendingCredentials(credentials);
        } catch (err) {
            setError(err.response?.data?.message ?? err.message);
        } finally {
            setTesting(false);
            setForm(f => ({ ...f, username: '', password: '' }));
            setCredentialsFieldKey(k => k + 1);
        }
    };

    const handleConnect = async () => {
        if (selectedTables.length === 0 || !pendingCredentials) return;
        setSaving(true);
        setError(null);
        try {
            const connection = await createDatabaseConnection(chatbot.id, {
                ...pendingCredentials, tables: selectedTables, excluded_columns: excludedColumns,
            });
            setConnections(prev => [connection, ...prev]);
            setForm(EMPTY_FORM);
            setPendingCredentials(null);
            setTables(null);
            setSelected([]);
            setExcludedColumns({});
            onUpdate?.();
        } catch (err) {
            setError(err.response?.data?.message ?? err.message);
        } finally {
            setSaving(false);
            setPendingCredentials(null);
            setCredentialsFieldKey(k => k + 1);
        }
    };

    const handleResync = async (connection) => {
        setSyncingId(connection.id);
        try {
            const updated = await syncDatabaseConnection(chatbot.id, connection.id);
            setConnections(prev => prev.map(c => c.id === updated.id ? updated : c));
            onUpdate?.();
        } finally {
            setSyncingId(null);
        }
    };

    const handleDisconnect = async (connection) => {
        if (!confirm(`Disconnect "${connection.database}"? Its synced tables will be removed from the knowledge base.`)) return;
        await deleteDatabaseConnection(chatbot.id, connection.id);
        setConnections(prev => prev.filter(c => c.id !== connection.id));
        onUpdate?.();
    };

    const toggleTable = (table) => {
        setSelected(prev => prev.includes(table) ? prev.filter(t => t !== table) : [...prev, table]);
    };

    const toggleColumn = (table, column) => {
        setExcludedColumns(prev => {
            const current = prev[table] ?? [];
            const next = current.includes(column) ? current.filter(c => c !== column) : [...current, column];
            return { ...prev, [table]: next };
        });
    };

    const toggleMoreColumn = (table, column) => {
        setMoreExcludedColumns(prev => {
            const current = prev[table] ?? [];
            const next = current.includes(column) ? current.filter(c => c !== column) : [...current, column];
            return { ...prev, [table]: next };
        });
    };

    const handleOpenAddTables = async (connection) => {
        if (addingTablesFor === connection.id) {
            setAddingTablesFor(null);
            setMoreTables(null);
            return;
        }
        setAddingTablesFor(connection.id);
        setMoreTables(null);
        setMoreSelected([]);
        setMoreExcludedColumns({});
        setMoreError(null);
        setLoadingMore(true);
        try {
            const { tables } = await getAvailableTables(chatbot.id, connection.id);
            setMoreTables(tables.filter(t => !connection.tables.includes(t.name)));
        } catch (err) {
            setMoreError(err.response?.data?.message ?? err.message);
        } finally {
            setLoadingMore(false);
        }
    };

    const toggleMoreTable = (table) => {
        setMoreSelected(prev => prev.includes(table) ? prev.filter(t => t !== table) : [...prev, table]);
    };

    const handleAddTables = async (connection) => {
        if (moreSelected.length === 0) return;
        setSavingMore(true);
        setMoreError(null);
        try {
            const updated = await addDatabaseTables(chatbot.id, connection.id, moreSelected, moreExcludedColumns);
            setConnections(prev => prev.map(c => c.id === updated.id ? updated : c));
            setAddingTablesFor(null);
            setMoreTables(null);
            setMoreSelected([]);
            setMoreExcludedColumns({});
            onUpdate?.();
        } catch (err) {
            setMoreError(err.response?.data?.message ?? err.message);
        } finally {
            setSavingMore(false);
        }
    };

    return (
        <div className="border-t border-white/10 pt-5 mt-5 flex-shrink-0">
            <h3 className="text-sm font-semibold text-white mb-1">Connect a Database</h3>
            <p className="text-xs text-navy-300 mb-4">
                Pull data straight from your MySQL, MariaDB, PostgreSQL, SQL Server, Oracle, SQLite, or MongoDB database into the knowledge base.
                Select the tables you want — they'll sync as searchable content for your chatbot.
            </p>

            {!loading && connections.length > 0 && (
                <div className="space-y-2 mb-4">
                    {connections.map(conn => (
                        <div key={conn.id} className="bg-navy-950 border border-white/10 rounded-lg px-4 py-3">
                            <div className="flex items-center gap-3">
                                <span className="text-xl flex-shrink-0">🗄️</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white truncate">{conn.database} <span className="text-navy-400">({conn.driver})</span></p>
                                    <p className="text-xs text-navy-300">
                                        {conn.tables.length} table{conn.tables.length !== 1 ? 's' : ''} ·{' '}
                                        <span className={STATUS_STYLES[conn.status] ?? 'text-navy-300'}>{conn.status}</span>
                                        {conn.last_synced_at && <> · synced {new Date(conn.last_synced_at).toLocaleString()}</>}
                                    </p>
                                    {conn.status === 'failed' && conn.error_message && (
                                        <p className="text-xs text-red-400 truncate" title={conn.error_message}>{conn.error_message}</p>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleOpenAddTables(conn)}
                                    className="text-xs px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-navy-200 transition flex-shrink-0"
                                >
                                    {addingTablesFor === conn.id ? 'Cancel' : '+ Add Tables'}
                                </button>
                                <button
                                    onClick={() => handleResync(conn)}
                                    disabled={syncingId === conn.id}
                                    className="text-xs px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-navy-200 transition flex-shrink-0 disabled:opacity-50"
                                >
                                    {syncingId === conn.id ? 'Syncing…' : 'Re-sync'}
                                </button>
                                <button onClick={() => handleDisconnect(conn)}
                                    className="p-1.5 rounded hover:bg-white/10 text-navy-300 hover:text-red-400 transition flex-shrink-0">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>

                            {addingTablesFor === conn.id && (
                                <div className="border-t border-white/10 mt-3 pt-3">
                                    {loadingMore ? (
                                        <p className="text-sm text-navy-300">Loading tables…</p>
                                    ) : moreError ? (
                                        <div className="px-3 py-2 bg-red-900/40 border border-red-700 rounded-lg text-red-300 text-sm">
                                            {moreError}
                                        </div>
                                    ) : moreTables && moreTables.length === 0 ? (
                                        <p className="text-sm text-navy-300">All tables from this database are already added.</p>
                                    ) : moreTables ? (
                                        <>
                                            <p className="text-xs text-navy-300 mb-2">Select more tables to add ({moreSelected.length} selected):</p>
                                            <div className="max-h-56 overflow-y-auto space-y-1 mb-3">
                                                {moreTables.map(table => (
                                                    <div key={table.name} className="rounded hover:bg-white/5">
                                                        <div className="flex items-center gap-2 px-2 py-1">
                                                            <label className="flex items-center gap-2 text-sm text-navy-200 cursor-pointer flex-1">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={moreSelected.includes(table.name)}
                                                                    onChange={() => toggleMoreTable(table.name)}
                                                                    className="rounded border-white/20 bg-navy-800 text-gold-600 focus:ring-gold-500"
                                                                />
                                                                {table.name}
                                                            </label>
                                                            {table.columns?.length > 0 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setMoreExpandedTable(t => t === table.name ? null : table.name)}
                                                                    className="text-xs text-navy-400 hover:text-gold-400"
                                                                >
                                                                    {(moreExcludedColumns[table.name]?.length ?? 0) > 0
                                                                        ? `${moreExcludedColumns[table.name].length} excluded`
                                                                        : 'Columns'}
                                                                </button>
                                                            )}
                                                        </div>
                                                        {moreExpandedTable === table.name && (
                                                            <div className="ml-7 mb-2 grid grid-cols-2 gap-0.5">
                                                                {table.columns.map(col => (
                                                                    <label key={col} className="flex items-center gap-1.5 text-xs text-navy-300 px-1 cursor-pointer">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={!(moreExcludedColumns[table.name] ?? []).includes(col)}
                                                                            onChange={() => toggleMoreColumn(table.name, col)}
                                                                            className="rounded border-white/20 bg-navy-800 text-gold-600 focus:ring-gold-500"
                                                                        />
                                                                        {col}
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-xs text-navy-400 mb-2">
                                                Uncheck a column to exclude it from the knowledge base — useful for sensitive fields
                                                like emails, SSNs, or passwords that public chatbot visitors shouldn't be able to ask about.
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => handleAddTables(conn)}
                                                disabled={savingMore || moreSelected.length === 0}
                                                className="px-4 py-2 bg-gold-600 hover:bg-gold-500 disabled:opacity-50 rounded-lg text-sm font-medium transition"
                                            >
                                                {savingMore ? 'Adding…' : `Add ${moreSelected.length} Table${moreSelected.length !== 1 ? 's' : ''}`}
                                            </button>
                                        </>
                                    ) : null}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <form onSubmit={handleTest} className="bg-navy-950 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <select
                        value={form.driver}
                        onChange={e => handleDriverChange(e.target.value)}
                        className="bg-navy-800 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-gold-500"
                    >
                        {DRIVER_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <input
                        type="text" placeholder={isFileBased ? 'Database file path (e.g. /path/to/app.sqlite)' : 'Database name'}
                        value={form.database} required
                        onChange={e => setForm(f => ({ ...f, database: e.target.value }))}
                        className={`bg-navy-800 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-navy-300 outline-none focus:border-gold-500 ${isFileBased ? 'col-span-2' : ''}`}
                    />

                    {!isFileBased && (
                        <>
                            <input
                                type="text" placeholder="Host (e.g. localhost)" value={form.host} required
                                onChange={e => setForm(f => ({ ...f, host: e.target.value }))}
                                className="bg-navy-800 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-navy-300 outline-none focus:border-gold-500"
                            />
                            <input
                                type="number" placeholder="Port" value={form.port} required
                                onChange={e => setForm(f => ({ ...f, port: e.target.value }))}
                                className="bg-navy-800 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-navy-300 outline-none focus:border-gold-500"
                            />
                            <input
                                key={`username-${credentialsFieldKey}`}
                                type="text" placeholder={form.driver === 'mongodb' ? 'Username (optional)' : 'Username'}
                                defaultValue={form.username} required={form.driver !== 'mongodb'}
                                autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false"
                                name="db_username_no_autofill"
                                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                                className="bg-navy-800 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-navy-300 outline-none focus:border-gold-500"
                            />
                            <input
                                key={`password-${credentialsFieldKey}`}
                                type="password" placeholder="Password" defaultValue={form.password}
                                autoComplete="new-password"
                                name="db_password_no_autofill"
                                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                className="bg-navy-800 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-navy-300 outline-none focus:border-gold-500"
                            />
                        </>
                    )}
                </div>

                {(form.driver === 'sqlsrv' || form.driver === 'oci') && (
                    <p className="text-xs text-yellow-400/80">
                        Note: {form.driver === 'sqlsrv' ? 'SQL Server' : 'Oracle'} support requires the matching PHP
                        PDO extension ({form.driver === 'sqlsrv' ? 'pdo_sqlsrv' : 'pdo_oci'}) to be enabled on the server.
                    </p>
                )}
                {form.driver === 'mongodb' && (
                    <p className="text-xs text-yellow-400/80">
                        Note: MongoDB support requires the "mongodb" PHP extension and the "mongodb/mongodb"
                        Composer package to be installed on the server.
                    </p>
                )}

                {error && (
                    <div className="px-3 py-2 bg-red-900/40 border border-red-700 rounded-lg text-red-300 text-sm">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={testing}
                    className="px-4 py-2 bg-gold-600 hover:bg-gold-500 disabled:opacity-50 rounded-lg text-sm font-medium text-white transition"
                >
                    {testing ? 'Testing connection…' : 'Test Connection'}
                </button>

                {tables && (
                    <div className="border-t border-white/10 pt-3 mt-3">
                        {tables.length === 0 ? (
                            <p className="text-sm text-navy-300">Connected, but no tables were found.</p>
                        ) : (
                            <>
                                <p className="text-xs text-navy-300 mb-2">Select the tables to sync ({selectedTables.length} selected):</p>
                                <div className="max-h-56 overflow-y-auto space-y-1 mb-3">
                                    {tables.map(table => (
                                        <div key={table.name} className="rounded hover:bg-white/5">
                                            <div className="flex items-center gap-2 px-2 py-1">
                                                <label className="flex items-center gap-2 text-sm text-navy-200 cursor-pointer flex-1">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedTables.includes(table.name)}
                                                        onChange={() => toggleTable(table.name)}
                                                        className="rounded border-white/20 bg-navy-800 text-gold-600 focus:ring-gold-500"
                                                    />
                                                    {table.name}
                                                </label>
                                                {table.columns?.length > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setExpandedTable(t => t === table.name ? null : table.name)}
                                                        className="text-xs text-navy-400 hover:text-gold-400"
                                                    >
                                                        {(excludedColumns[table.name]?.length ?? 0) > 0
                                                            ? `${excludedColumns[table.name].length} excluded`
                                                            : 'Columns'}
                                                    </button>
                                                )}
                                            </div>
                                            {expandedTable === table.name && (
                                                <div className="ml-7 mb-2 grid grid-cols-2 gap-0.5">
                                                    {table.columns.map(col => (
                                                        <label key={col} className="flex items-center gap-1.5 text-xs text-navy-300 px-1 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={!(excludedColumns[table.name] ?? []).includes(col)}
                                                                onChange={() => toggleColumn(table.name, col)}
                                                                className="rounded border-white/20 bg-navy-800 text-gold-600 focus:ring-gold-500"
                                                            />
                                                            {col}
                                                        </label>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-navy-400 mb-2">
                                    Uncheck a column to exclude it from the knowledge base — useful for sensitive fields
                                    like emails, SSNs, or passwords that public chatbot visitors shouldn't be able to ask about.
                                </p>
                                <button
                                    type="button"
                                    onClick={handleConnect}
                                    disabled={saving || selectedTables.length === 0}
                                    className="px-4 py-2 bg-gold-600 hover:bg-gold-500 disabled:opacity-50 rounded-lg text-sm font-medium transition"
                                >
                                    {saving ? 'Connecting…' : `Connect & Sync ${selectedTables.length} Table${selectedTables.length !== 1 ? 's' : ''}`}
                                </button>
                            </>
                        )}
                    </div>
                )}
            </form>
        </div>
    );
}
