import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema({
    user: { type: String, required: true },
    title: { type: String, required: true },
    dueDate: { type: Date, required: true },
    details: { type: String, required: true },
    completed: { type: Boolean, default: false } 
});

const TaskModel = mongoose.model('Task', TaskSchema, 'tasks');
export default TaskModel;
