'use client';

import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { User } from './UserManagement';

interface UserDeleteConfirmationProps {
  user: User;
  onClose: () => void;
  onConfirm: () => void;
}

const UserDeleteConfirmation: React.FC<UserDeleteConfirmationProps> = ({
  user,
  onClose,
  onConfirm,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setIsDeleting(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-xl font-semibold text-gray-900">Confirm Deletion</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center mb-4 text-yellow-600">
            <AlertTriangle className="h-10 w-10 mr-4" />
            <div>
              <h4 className="text-lg font-medium text-gray-900">Delete User</h4>
              <p className="text-gray-500">
                This action cannot be undone. All user data will be permanently removed.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-md mb-4">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Name:</span> {user.full_name}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Email:</span> {user.email}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Role:</span> {user.role}
            </p>
          </div>

          <p className="text-sm text-gray-500 mb-4">
            Please type <span className="font-bold">DELETE</span> to confirm:
          </p>
          
          <input
            type="text"
            id="confirmation"
            className="border border-gray-300 rounded-md p-2 w-full mb-4 focus:ring-red-500 focus:border-red-500"
            placeholder="Type DELETE here"
            onChange={(e) => {
              const confirmButton = document.getElementById('confirmDeleteButton') as HTMLButtonElement;
              if (confirmButton) {
                confirmButton.disabled = e.target.value !== 'DELETE';
              }
            }}
          />

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              id="confirmDeleteButton"
              type="button"
              onClick={handleConfirm}
              disabled={true}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? 'Deleting...' : 'Delete User'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDeleteConfirmation;
