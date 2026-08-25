import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Message } from '../types';
import { Image as ImageIcon, Upload, Heart, X, Calendar, Download, Sparkles, Filter, Moon, Wand2, Trash2, AlertCircle } from 'lucide-react';

interface Props {
  messages: Message[];
  currentUser: User;
  partner?: User | null;
  onUploadPhoto: (text: string, type: 'image', url: string) => Promise<void>;
  onDeletePhoto?: (messageId: string) => Promise<void> | void;
}

export const GalleryScreen: React.FC<Props> = ({
  messages,
  currentUser,
  partner,
  onUploadPhoto,
  onDeletePhoto,
}) => {
  const [selectedImage, setSelectedImage] = useState<Message | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [filterSender, setFilterSender] = useState<'all' | 'me' | 'partner'>('all');
  const [isUploading, setIsUploading] = useState(false);

  // Filter image messages
  const imageMessages = messages.filter((m) => m.type === 'image' && m.imageUrl);

  const filteredImages = imageMessages.filter((m) => {
    if (filterSender === 'me') return m.senderId === currentUser.uid;
    if (filterSender === 'partner') return partner ? m.senderId === partner.uid : false;
    return true;
  });

  const handleDelete = async (msgId: string) => {
    if (onDeletePhoto) {
      await onDeletePhoto(msgId);
    }
    if (selectedImage?.id === msgId) {
      setSelectedImage(null);
    }
    setConfirmDeleteId(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        await onUploadPhoto('Added to celestial gallery ✨', 'image', base64);
      }
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex-1 cosmos-grid-bg p-4 sm:p-6 overflow-y-auto text-slate-100 pb-24 md:pb-6">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header Title & Actions */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 cosmic-card p-5 sm:p-6 rounded-3xl"
        >
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#f5a623]/10 border border-[#f5a623]/40 flex items-center justify-center text-[#f5a623]">
                <ImageIcon className="w-4 h-4" />
              </div>
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-white flex items-center gap-2">
                Celestial Memory Gallery
                <Sparkles className="w-4 h-4 text-[#f5a623] animate-pulse" />
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-serif">
              Captured moments across the stars with {partner.displayName.split(' ')[0]} ({imageMessages.length} memories)
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter */}
            <div className="flex items-center bg-black/40 p-1 rounded-2xl border border-white/10 text-xs font-medium">
              <button
                onClick={() => setFilterSender('all')}
                className={`px-3.5 py-1.5 rounded-xl font-serif transition-all cursor-pointer ${
                  filterSender === 'all' ? 'amber-pill-btn text-black font-bold shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterSender('me')}
                className={`px-3.5 py-1.5 rounded-xl font-serif transition-all cursor-pointer ${
                  filterSender === 'me' ? 'amber-pill-btn text-black font-bold shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                You
              </button>
              <button
                onClick={() => setFilterSender('partner')}
                className={`px-3.5 py-1.5 rounded-xl font-serif transition-all cursor-pointer ${
                  filterSender === 'partner' ? 'amber-pill-btn text-black font-bold shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                {partner.displayName.split(' ')[0]}
              </button>
            </div>

            {/* Upload Button */}
            <label className="amber-pill-btn text-black font-serif text-xs font-bold px-4 py-2.5 rounded-2xl shadow-lg transition-all flex items-center gap-2 cursor-pointer shrink-0 hover:scale-105">
              <Upload className="w-4 h-4" />
              <span>{isUploading ? 'Uploading...' : 'Add Memory'}</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
            </label>
          </div>
        </motion.div>

        {/* Photo Grid */}
        {filteredImages.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
            {filteredImages.map((msg, idx) => {
              const uploader = msg.senderId === currentUser.uid ? currentUser : partner;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, scale: 0.9, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.04 }}
                  onClick={() => setSelectedImage(msg)}
                  className="group relative aspect-square bg-white/[0.03] rounded-3xl overflow-hidden border border-white/10 cursor-pointer shadow-md hover:shadow-2xl hover:border-[#f5a623]/60 transition-all duration-300"
                >
                  <img
                    src={msg.imageUrl}
                    alt="Memory"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Quick Delete button */}
                  {onDeletePhoto && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteId(msg.id);
                      }}
                      className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-black/60 hover:bg-red-500/80 text-white/70 hover:text-white opacity-0 group-hover:opacity-100 transition-all shadow-md z-10"
                      title="Delete Memory"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3.5 flex flex-col justify-end text-white">
                    <p className="text-xs font-serif font-semibold line-clamp-1 text-white">{msg.text || 'Celestial memory'}</p>
                    <div className="flex items-center justify-between text-[10px] text-[#f5a623] mt-1 font-serif">
                      <span>By {uploader.displayName.split(' ')[0]}</span>
                      <span>{new Date(msg.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="cosmic-card rounded-3xl p-12 text-center border border-dashed border-white/15 space-y-3"
          >
            <div className="w-16 h-16 rounded-full bg-[#f5a623]/10 border border-[#f5a623]/40 flex items-center justify-center mx-auto text-[#f5a623]">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-base font-serif font-bold text-white">No stars in gallery yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto font-serif">
              Upload memories here or share them in your celestial space to create your shared galaxy!
            </p>
            <label className="inline-flex amber-pill-btn text-black font-serif text-xs font-bold px-5 py-2.5 rounded-2xl shadow-lg transition-all cursor-pointer items-center gap-2 hover:scale-105">
              <Upload className="w-4 h-4" />
              <span>Upload First Memory</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </label>
          </motion.div>
        )}

      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-3xl w-full cosmic-card rounded-3xl overflow-hidden shadow-2xl border border-white/15 flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-4 bg-[#0b0914] border-b border-white/10 flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <img
                  src={selectedImage.senderId === currentUser.uid ? currentUser.photoUrl : partner.photoUrl}
                  alt="Uploader"
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-[#f5a623]/60"
                />
                <div>
                  <h4 className="text-xs font-serif font-bold text-white">
                    Shared by {selectedImage.senderId === currentUser.uid ? 'You' : partner.displayName}
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    {new Date(selectedImage.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onDeletePhoto && (
                  <button
                    onClick={() => setConfirmDeleteId(selectedImage.id)}
                    className="w-8 h-8 rounded-full bg-red-950/60 hover:bg-red-600 border border-red-500/30 flex items-center justify-center text-red-200 hover:text-white cursor-pointer transition-colors"
                    title="Delete Memory"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setSelectedImage(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Image Preview */}
            <div className="flex-1 bg-black/80 flex items-center justify-center overflow-hidden p-2">
              <img
                src={selectedImage.imageUrl}
                alt="Memory Full"
                className="max-h-[65vh] max-w-full object-contain rounded-xl"
              />
            </div>

            {/* Caption */}
            {selectedImage.text && (
              <div className="p-4 bg-[#0b0914] text-xs text-slate-200 border-t border-white/10">
                <p className="font-serif italic text-[#f5a623]">"{selectedImage.text}"</p>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/85 z-70 flex items-center justify-center p-4">
          <div className="bg-[#120e24] border border-red-500/50 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-white text-base">Delete Gallery Memory?</h4>
              <p className="text-xs text-slate-400 mt-1 font-serif">
                This celestial photo memory will be permanently removed from your shared vault and scrapbook.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2 font-serif">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-slate-200 font-medium cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                className="flex-1 py-2 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-xs text-white font-bold cursor-pointer transition-colors shadow-lg"
              >
                Delete Memory
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

