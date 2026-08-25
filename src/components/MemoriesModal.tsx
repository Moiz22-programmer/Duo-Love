import React, { useState } from 'react';
import { Message, User } from '../types';
import { Image as ImageIcon, X, Download, Calendar, Sparkles, Trash2, AlertCircle } from 'lucide-react';

interface Props {
  messages: Message[];
  currentUser: User;
  partner: User | null;
  onDeleteMemory?: (messageId: string) => Promise<void> | void;
  onClose: () => void;
}

export const MemoriesModal: React.FC<Props> = ({
  messages,
  currentUser,
  partner,
  onDeleteMemory,
  onClose,
}) => {
  const [selectedPhotoMsg, setSelectedPhotoMsg] = useState<Message | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Extract all photo messages
  const photoMessages = messages.filter((m) => m.type === 'image' && m.imageUrl);

  const handleDelete = async (msgId: string) => {
    if (onDeleteMemory) {
      await onDeleteMemory(msgId);
    }
    if (selectedPhotoMsg?.id === msgId) {
      setSelectedPhotoMsg(null);
    }
    setConfirmDeleteId(null);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 text-slate-100">
      <div className="cosmic-card border border-[#f5a623]/60 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Modal Header */}
        <div className="p-4 bg-black/50 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#f5a623]/10 rounded-xl text-[#f5a623] border border-[#f5a623]/30">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-white text-base flex items-center gap-1.5">
                Celestial Photo Vault ✨
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                {photoMessages.length} {photoMessages.length === 1 ? 'Star' : 'Stars'} in your Shared Galaxy
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 text-slate-400 hover:text-white rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Photos Grid Area */}
        <div className="flex-1 overflow-y-auto p-4">
          {photoMessages.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6">
              <div className="w-16 h-16 bg-[#f5a623]/10 border border-[#f5a623]/30 rounded-full flex items-center justify-center text-[#f5a623] mb-3">
                <Sparkles className="w-8 h-8 fill-[#f5a623]" />
              </div>
              <p className="text-white font-serif font-bold text-sm">No Celestial Photos Yet</p>
              <p className="text-slate-400 text-xs mt-1">
                Upload photos in your chat or gallery to build your shared galaxy album!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photoMessages.map((msg) => {
                const dateStr = new Date(msg.createdAt).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                });

                return (
                  <div
                    key={msg.id}
                    onClick={() => setSelectedPhotoMsg(msg)}
                    className="relative group rounded-2xl overflow-hidden aspect-square bg-black/60 cursor-pointer border border-white/10 shadow-md hover:scale-102 hover:border-[#f5a623]/50 transition-all duration-200"
                  >
                    <img
                      src={msg.imageUrl}
                      alt="Memory"
                      className="w-full h-full object-cover"
                    />

                    {/* Delete button on top right */}
                    {onDeleteMemory && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteId(msg.id);
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-red-500/80 text-white/70 hover:text-white opacity-0 group-hover:opacity-100 transition-all shadow-md z-10"
                        title="Delete Memory"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2.5 flex flex-col justify-end text-white">
                      <p className="text-[11px] font-bold flex items-center gap-1 text-[#f5a623]">
                        <Calendar className="w-3 h-3 text-[#f5a623]" />
                        {dateStr}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Confirmation Modal */}
        {confirmDeleteId && (
          <div className="fixed inset-0 bg-black/80 z-70 flex items-center justify-center p-4">
            <div className="bg-[#120e24] border border-red-500/50 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-white text-sm">Delete Celestial Memory?</h4>
                <p className="text-xs text-slate-400 mt-1 font-serif">
                  This photo memory will be permanently removed from your shared vault and scrapbook.
                </p>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-slate-200 font-serif font-medium cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(confirmDeleteId)}
                  className="flex-1 py-2 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-xs text-white font-serif font-bold cursor-pointer transition-colors shadow-lg"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lightbox photo viewer */}
        {selectedPhotoMsg && (
          <div className="fixed inset-0 bg-black/90 z-60 flex items-center justify-center p-4">
            <div className="relative max-w-3xl w-full">
              <div className="absolute top-0 right-0 p-4 flex items-center gap-2.5 z-10">
                {onDeleteMemory && (
                  <button
                    onClick={() => setConfirmDeleteId(selectedPhotoMsg.id)}
                    className="p-2 bg-red-950/70 hover:bg-red-600 text-red-200 hover:text-white border border-red-500/30 rounded-full transition-colors cursor-pointer"
                    title="Delete Memory"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
                <a
                  href={selectedPhotoMsg.imageUrl}
                  download="celestial-memory.jpg"
                  className="p-2 bg-white/20 hover:bg-white/40 text-white rounded-full transition-colors"
                  title="Download"
                >
                  <Download className="w-5 h-5" />
                </a>
                <button
                  onClick={() => setSelectedPhotoMsg(null)}
                  className="p-2 bg-white/20 hover:bg-white/40 text-white rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <img
                src={selectedPhotoMsg.imageUrl}
                alt="Selected Memory"
                className="max-h-[80vh] w-full object-contain rounded-2xl shadow-2xl border border-white/20"
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

