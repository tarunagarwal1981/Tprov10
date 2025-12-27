'use client';

import React, { useState } from 'react';
import { FiEdit2, FiSave, FiX } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/useToast';
import { getAccessToken } from '@/lib/auth/getAccessToken';

interface LeadNotesEditorProps {
  leadId: string;
  notes: string | null;
  requirements: string | null;
  onUpdate?: () => void;
}

export function LeadNotesEditor({ leadId, notes, requirements, onUpdate }: LeadNotesEditorProps) {
  const toast = useToast();
  const [editingNotes, setEditingNotes] = useState(false);
  const [editingRequirements, setEditingRequirements] = useState(false);
  const [notesValue, setNotesValue] = useState(notes || '');
  const [requirementsValue, setRequirementsValue] = useState(requirements || '');
  const [loading, setLoading] = useState(false);

  const handleSaveNotes = async () => {
    setLoading(true);
    try {
      const accessToken = getAccessToken();
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken || ''}`,
        },
        body: JSON.stringify({ notes: notesValue }),
      });

      if (response.ok) {
        toast.success('Notes updated successfully');
        setEditingNotes(false);
        onUpdate?.();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update notes');
      }
    } catch (error) {
      console.error('Error updating notes:', error);
      toast.error('Failed to update notes');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRequirements = async () => {
    setLoading(true);
    try {
      const accessToken = getAccessToken();
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken || ''}`,
        },
        body: JSON.stringify({ requirements: requirementsValue }),
      });

      if (response.ok) {
        toast.success('Requirements updated successfully');
        setEditingRequirements(false);
        onUpdate?.();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update requirements');
      }
    } catch (error) {
      console.error('Error updating requirements:', error);
      toast.error('Failed to update requirements');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Notes Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Notes</CardTitle>
            {!editingNotes ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingNotes(true)}
              >
                <FiEdit2 className="w-4 h-4 mr-1" />
                Edit
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingNotes(false);
                    setNotesValue(notes || '');
                  }}
                  disabled={loading}
                >
                  <FiX className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveNotes}
                  disabled={loading}
                >
                  <FiSave className="w-4 h-4 mr-1" />
                  Save
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editingNotes ? (
            <Textarea
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
              placeholder="Add notes about this lead..."
              rows={6}
              className="w-full"
            />
          ) : (
            <p className="text-sm text-gray-600 whitespace-pre-wrap">
              {notes || 'No notes added yet.'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Requirements Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Requirements</CardTitle>
            {!editingRequirements ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingRequirements(true)}
              >
                <FiEdit2 className="w-4 h-4 mr-1" />
                Edit
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingRequirements(false);
                    setRequirementsValue(requirements || '');
                  }}
                  disabled={loading}
                >
                  <FiX className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveRequirements}
                  disabled={loading}
                >
                  <FiSave className="w-4 h-4 mr-1" />
                  Save
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editingRequirements ? (
            <Textarea
              value={requirementsValue}
              onChange={(e) => setRequirementsValue(e.target.value)}
              placeholder="Add requirements for this lead..."
              rows={6}
              className="w-full"
            />
          ) : (
            <p className="text-sm text-gray-600 whitespace-pre-wrap">
              {requirements || 'No requirements added yet.'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

