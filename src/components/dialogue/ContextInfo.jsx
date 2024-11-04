import React from 'react';

const ContextInfo = ({ context, primary, secondary, technical, cultural }) => {
  return (
    <div className="p-4 bg-gray-50 space-y-4">
      <h3 className="font-medium">Context Information</h3>
      
      <div>
        <h4 className="text-sm font-medium">Scene Context:</h4>
        <p className="text-sm text-gray-600">{context}</p>
      </div>

      <div>
        <h4 className="text-sm font-medium">Emotional State:</h4>
        <div className="space-y-1">
          <p className="text-sm text-gray-600">
            Primary: {primary.emotion} (Intensity: {primary.intensity})
          </p>
          <p className="text-sm text-gray-600">
            Secondary: {secondary.emotion} (Intensity: {secondary.intensity})
          </p>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium">Technical Notes:</h4>
        <p className="text-sm text-gray-600">{technical}</p>
      </div>

      <div>
        <h4 className="text-sm font-medium">Cultural Notes:</h4>
        <p className="text-sm text-gray-600">{cultural}</p>
      </div>
    </div>
  );
};

export default ContextInfo;