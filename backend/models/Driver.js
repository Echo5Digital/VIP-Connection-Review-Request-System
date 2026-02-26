import mongoose from 'mongoose';

const driverSchema = new mongoose.Schema({
    vipCarNum: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    carMake: { type: String, trim: true },
    carModel: { type: String, trim: true },
    carYear: { type: String, trim: true },
    vehicleType: {
        type: String,
        enum: ['Sedan', 'SUV', 'Luxury', ''],
        default: ''
    }
}, { timestamps: true });

export default mongoose.model('Driver', driverSchema);
