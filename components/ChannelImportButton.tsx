import React, { useRef, useState } from 'react';
import { ChannelManager } from '../services/ChannelManager';

interface Props {
  channelManager: ChannelManager;
  onChannelsAdded: (channelIds: string[]) => void;
}

export function ChannelImportButton({ channelManager, onChannelsAdded }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error' | 'warning' | null;
    message: string;
    details?: any;
  }>({ type: null, message: '' });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setImportStatus({ type: null, message: '' });

    try {
      // ✅ Validate file first
      const validation = channelManager.validateChannelFile(file);
      if (!validation.valid) {
        setImportStatus({
          type: 'error',
          message: `File validation failed: ${validation.errors.join(', ')}`
        });
        setIsLoading(false);
        return;
      }

      // ✅ Parse JSON
      const channelFile = await channelManager.parseChannelFile(file);
      if (!channelFile) {
        throw new Error('Failed to parse channel file');
      }

      console.log(`Parsed ${channelFile.channels.length} channels from file`);

      // ✅ Inject all channels (batch operation)
      const result = await channelManager.injectChannelsFromFile(channelFile);

      if (result.successful.length > 0) {
        setImportStatus({
          type: result.failed.length > 0 ? 'warning' : 'success',
          message: `✅ Imported ${result.successful.length} channel${result.successful.length !== 1 ? 's' : ''}`,
          details: {
            successful: result.successful,
            failed: result.failed.length > 0 ? result.failed : undefined
          }
        });

        // Notify parent component
        onChannelsAdded(result.successful);
      } else if (result.failed.length > 0) {
        setImportStatus({
          type: 'error',
          message: `❌ All channels failed to import`,
          details: result.failed
        });
      }
    } catch (error: any) {
      setImportStatus({
        type: 'error',
        message: `Import failed: ${error.message}`
      });
      console.error('Import error:', error);
    } finally {
      setIsLoading(false);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="channel-import-section">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileSelect}
        disabled={isLoading}
        style={{ display: 'none' }}
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isLoading}
        className="import-button"
      >
        {isLoading ? 'Importing...' : '➕ Add Channels from JSON'}
      </button>

      {/* Status Messages */}
      {importStatus.type && (
        <div className={`import-status import-status-${importStatus.type}`}>
          <p>{importStatus.message}</p>

          {importStatus.details?.successful && (
            <details>
              <summary>Imported Channels ({importStatus.details.successful.length})</summary>
              <ul>
                {importStatus.details.successful.map((id: string) => (
                  <li key={id}>✅ {id}</li>
                ))}
              </ul>
            </details>
          )}

          {importStatus.details?.failed && (
            <details>
              <summary>Failed Imports ({importStatus.details.failed.length})</summary>
              <ul>
                {importStatus.details.failed.map((failure: any) => (
                  <li key={failure.channelId}>
                    ❌ {failure.channelId}: {failure.reason}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      <style>{`
        .channel-import-section {
          padding: 1rem;
          border: 2px dashed #475569;
          border-radius: 8px;
          text-align: center;
          margin-bottom: 1rem;
          background: #1e293b;
        }

        .import-button {
          padding: 0.75rem 1.5rem;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
          transition: background 0.3s;
        }

        .import-button:hover:not(:disabled) {
          background: #1d4ed8;
        }

        .import-button:disabled {
          background: #64748b;
          cursor: not-allowed;
        }

        .import-status {
          margin-top: 1rem;
          padding: 1rem;
          border-radius: 6px;
          font-size: 0.9rem;
          text-align: left;
        }

        .import-status-success {
          background: #064e3b;
          color: #a7f3d0;
          border: 1px solid #059669;
        }

        .import-status-error {
          background: #7f1d1d;
          color: #fecaca;
          border: 1px solid #dc2626;
        }

        .import-status-warning {
          background: #78350f;
          color: #fde68a;
          border: 1px solid #d97706;
        }

        .import-status details {
          margin-top: 0.5rem;
          cursor: pointer;
        }

        .import-status ul {
          list-style: none;
          padding-left: 0;
          margin-top: 0.5rem;
        }

        .import-status li {
          padding: 0.25rem 0;
        }
      `}</style>
    </div>
  );
}
