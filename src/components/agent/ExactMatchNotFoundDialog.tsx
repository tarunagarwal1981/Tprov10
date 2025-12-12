"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FiAlertCircle, FiX } from 'react-icons/fi';

interface ExactMatchNotFoundDialogProps {
  isOpen: boolean;
  onYes: () => void;
  onNo: () => void;
}

export const ExactMatchNotFoundDialog: React.FC<ExactMatchNotFoundDialogProps> = ({
  isOpen,
  onYes,
  onNo,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
              <FiAlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <DialogTitle>Exact Itineraries Not Available</DialogTitle>
              <DialogDescription className="mt-1">
                No packages found with exact matching cities and nights.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-gray-600">
            Would you like to see similar packages from the same countries or with partial city matches?
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onNo}
            className="flex-1"
          >
            No, Go Back
          </Button>
          <Button
            onClick={onYes}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            Yes, Show Similar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

