import mongoose from 'mongoose';

const PROFILE_TYPES = ['GENERAL', 'FEATURE', 'NONE'];

function profilePlugin(schema, options = {}) {
  const isMultiple = options.multiple || false;

  const profileSchema = {
    typeOf: { type: String, enum: PROFILE_TYPES, default: PROFILE_TYPES[0] },
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    description: { type: String, default: '' },
    caption: { type: String, default: '' },
    photo: {
      url: String,
      meta: Object,
    },
    order: { type: Number, default: 0 },
  };

  if (isMultiple) {
    schema.add({ profiles: [profileSchema] });
  } else {
    schema.add({ profile: profileSchema });
  }
}

export default profilePlugin; 