import mongoose from 'mongoose';

function dateInfoPlugin(schema, options) {
  schema.add({
    startDate: Date,
    endDate: Date,
    startTime: String, // i.e., 08:00
    endTime: String, // i.e., 13:00
    timeZone: String
  });

  // Add any methods or hooks related to date handling here
  schema.methods.formatDateRange = function() {
    // Example method to format the date range
    return `${this.startDate.toLocaleDateString()} - ${this.endDate.toLocaleDateString()}`;
  };
}

export default dateInfoPlugin; 