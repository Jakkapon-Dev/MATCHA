import React from 'react';
import { Download, FileSpreadsheet, FileJson } from 'lucide-react';
import AdminDataState from './AdminDataState';

export default function BackupTab({ status, errors, handleExportFullJSON, handleExportInventory, handleExportOrders }) {
  return (<AdminDataState resources={["inventory","orders","members"]} status={status} errors={errors}>
            <div className="space-y-6 animate-fade-in">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Full Store JSON Backup Card */}
                <div className="p-6 rounded-2xl bg-white border border-matcha-border shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-matcha-accent flex items-center justify-center font-bold mb-4">
                      <FileJson size={20} />
                    </div>
                    <h3 className="font-bold text-lg text-matcha-text uppercase font-sans">Admin Data Snapshot</h3>
                    <p className="text-xs font-mono text-matcha-muted mt-2 leading-relaxed">
                      Export the loaded inventory, order summaries, and member directory. This report does not include credentials, media, or a restorable database backup.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-matcha-border">
                    <button
                      onClick={handleExportFullJSON}
                      className="w-full py-2.5 bg-matcha-accent hover:bg-matcha-accent-hover text-white rounded-xl font-mono text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Download size={14} />
                      <span>Download Admin Data (JSON)</span>
                    </button>
                  </div>
                </div>

                {/* CSV Spreadsheets Suite */}
                <div className="p-6 rounded-2xl bg-white border border-matcha-border shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-matcha-secondary/50 text-matcha-primary flex items-center justify-center font-bold mb-4">
                      <FileSpreadsheet size={20} />
                    </div>
                    <h3 className="font-bold text-lg text-matcha-text uppercase font-sans">Spreadsheet Datasets (CSV)</h3>
                    <p className="text-xs font-mono text-matcha-muted mt-2 leading-relaxed">
                      Export structured CSV files with UTF-8 BOM encoding ready for Excel, Google Sheets, or external ERP data imports.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-matcha-border space-y-2 font-mono text-xs">
                    <button
                      onClick={handleExportInventory}
                      className="w-full py-2 bg-matcha-primary hover:bg-matcha-primary-dark text-white rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <FileSpreadsheet size={13} />
                      <span>Export Garment Inventory (CSV)</span>
                    </button>
                    <button
                      onClick={handleExportOrders}
                      className="w-full py-2 bg-matcha-bg border border-matcha-border hover:border-matcha-primary text-matcha-text rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <FileSpreadsheet size={13} />
                      <span>Export Orders Pipeline (CSV)</span>
                    </button>
                  </div>
                </div>

              </div>

            </div>
            </AdminDataState>);
}
