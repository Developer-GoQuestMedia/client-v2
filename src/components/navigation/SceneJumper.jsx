import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, CheckCircle2 } from 'lucide-react';
import { useRecording } from '../../context/RecordingContext';

const SceneJumper = ({ open, onOpenChange }) => {
  const { dialogues, currentIndex, jumpToScene } = useRecording();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDialogues = dialogues.filter(dialogue => 
    dialogue.dialogue.original.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dialogue.dialogue.translated.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dialogue.character.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Jump to Scene</DialogTitle>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <input
            className="w-full pl-8 pr-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search by text or character..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="max-h-[400px] overflow-y-auto space-y-2">
          {filteredDialogues.map((dialogue, index) => (
            <div
              key={dialogue.id}
              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                index === currentIndex ? 'bg-blue-50 border-blue-200 border' : 'hover:bg-gray-50'
              }`}
              onClick={() => {
                jumpToScene(index);
                onOpenChange(false);
              }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium flex items-center gap-2">
                    {dialogue.character}
                    {dialogue.isCompleted && (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {dialogue.time_start} - {dialogue.time_end}
                  </div>
                </div>
              </div>
              <div className="mt-1 text-sm text-gray-600 line-clamp-2">
                {dialogue.dialogue.original}
              </div>
              <div className="mt-1 text-sm text-gray-500 line-clamp-1">
                {dialogue.dialogue.translated}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SceneJumper;