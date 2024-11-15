import React from 'react';

  const ContextInfo = ({ context }) => {
    // Destructure the context object
    const {
      sceneContext,
      emotions: {
        primary = { emotion: 'N/A', intensity: 0 }, // Default values if undefined
        secondary = { emotion: 'N/A', intensity: 0 },
      } = {},
      technical = 'N/A', // Default value if undefined
      cultural = 'N/A', // Default value if undefined
    } = context || {}; // Default to an empty object if context is undefined
  return (
    <div className="p-4 bg-white  h-52 flex flex-col gap-1 mb-4 ">
      <h3 className="font-medium">Context Information</h3>
      
      {/* <div className='flex gap-1'>
        <h4 className="text-sm font-medium">Scene Context:</h4>
        <span className="text-sm text-gray-600">{sceneContext}</span>
      </div> */}

      {/* <div className='flex gap-1'>
        <h4 className="text-sm font-medium">Emotional State:</h4>
        <div className="space-y-1 flex gap-1">
          {/* <p className="text-sm text-gray-600">
            Primary: {primary.emotion} (Intensity: {primary.intensity})
          </p>
          <p className="text-sm  text-gray-600 relative -top-1">
            Secondary: {secondary.emotion} (Intensity: {secondary.intensity})
          </p> 
         <p>{primary.emotion}</p>
        </div>
      </div> */}

      {/* <div className='flex gap-1'>
        <h4 className="text-sm font-medium">Technical Notes:</h4>
        <p className="text-sm text-gray-600">{technical}</p>
      </div>

      <div className='flex gap-1'>
        <h4 className="text-sm font-medium">Cultural Notes:</h4>
        <p className="text-sm text-gray-600">{cultural}</p>
      </div> */}  

      <p>Scene Context: {sceneContext}</p>
      <p>Emotional State: {primary.emotion}</p>
      <p>Technical Notes: {technical}</p>
      <p>Cultural Notes: {technical}</p>
    </div>
  );
};

export default ContextInfo;