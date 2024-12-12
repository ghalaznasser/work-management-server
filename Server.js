import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import UserModel from "./Models/User.js";
import TaskModel from "./Models/Task.js";
import bcrypt from 'bcrypt';

let app = express();
app.use(cors());
app.use(express.json());

const MongConnect = "mongodb+srv://Admin:1234@cluster0.tz9iw0t.mongodb.net/ManageDB";
mongoose.connect(MongConnect,{
    useNewUrlParser: true,
    useUnifiedTopology:true
});

// api for insert new User
app.post("/api/insertUser", async (req, res) => {
    try {
        const user = await UserModel.findOne({ user: req.body.user });
        const email = await UserModel.findOne({ email: req.body.email });

        if (user) {
            return res.status(400).json({ message: "User already exists." });
        } else if (email) {
            return res.status(400).json({ message: "Email already exists." });
        } else {
            const hashedPassword = await bcrypt.hash(req.body.password, 10);

            const newUser = new UserModel({
                user: req.body.user,
                password: hashedPassword, 
                email: req.body.email,
                gender: req.body.gender,
                imgUrl: req.body.imgUrl,
                country: req.body.country,
                city: req.body.city,
                isp: req.body.isp,
                timezone: req.body.timezone,
                country_code: req.body.country_code,
            });

            await newUser.save();
            return res.status(201).json({ message: "User added successfully." });
        }
    } catch (error) {
        console.error("Error saving user:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
});

// api for login User
app.post("/api/login", async (req, res) => {
    try {
        const user = await UserModel.findOne({ user: req.body.user });
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        } else {
            // Compare the hashed password
            const isMatch = await bcrypt.compare(req.body.password, user.password);
            if (isMatch) {
                return res.status(200).json({ user: user, message: "Login successful." });
            } else {
                return res.status(401).json({ message: "Invalid password." });
            }
        }
    } catch (error) {
        console.error("Error during login:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
});

// api to update user details
app.put('/api/updateUser/:user', async (req, res) => {
    try {
        const { user } = req.params;
        const { password, imgUrl, gender } = req.body;

        const existingUser = await UserModel.findOne({ user });
        if (!existingUser) {
            return res.status(404).json({ message: 'User not found.' });
        }
        // Update only the allowed fields
        if (password) {
            existingUser.password = await bcrypt.hash(password, 10); 
        }
        if (imgUrl) {
            existingUser.imgUrl = imgUrl;
        }
        if (gender) {
            existingUser.gender = gender;
        }

        const updatedUser = await existingUser.save();
        res.status(200).json({ message: 'User updated successfully.', user: updatedUser });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Internal server error.', error: error.message });
    }
});


// api for get Users details
app.get("/api/getUsers", async (req, res) => {
    try {
        // Fetch users where isAdmin is false
        const users = await UserModel.find({ isAdmin: false });
        return res.status(200).json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
});

// api for insert new Task
app.post("/api/inserTask", async (req, res) => {
    try {
            const newTask = new TaskModel({
                user: req.body.user,
                title: req.body.title,
                dueDate: req.body.dueDate,
                details: req.body.details,
                completed: req.body.completed,
            });
            await newTask.save();
            return res.status(201).json({ message: "Task added successfully." });
        } catch (error) {
        console.error("Error saving user:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
});

// api for aggrecation to get User Tasks
app.get("/api/getSpecificTask", async (req, res) => {
    try {
        const TaskWithUser = await TaskModel.aggregate([
            {
                $lookup: {
                    from: "users", 
                    localField: "user", // Field in TaskModel
                    foreignField: "user", // Field in UserModel for joining
                    as: "userdata"
                }
            },
            {
                "$project": {
                    "userdata.password": 0, // ignore password
                    "userdata.user": 0 // ignore user
                }
            }
        ]);
        if (!TaskWithUser || TaskWithUser.length === 0) {
            return res.status(404).json({ message: "No tasks found." });
        }
        res.json({ Task: TaskWithUser });
    } catch (error) {
        console.error("Error fetching specific tasks:", error); 
        return res.status(500).json({ message: error.message });
    }
});

// api for insert any User
app.delete('/api/deleteUser/:user', async (req, res) => {
    try {
      const { user } = req.params; 
      // Find and delete the user
      const deletedUser = await UserModel.findOneAndDelete({ user });
      if (!deletedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.status(200).json({ message: 'User deleted successfully', deletedUser });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting user', error: error.message });
    }
  });

// api for insert any task
app.delete('/api/tasks/:id', async (req, res) => {
    try {
        const deletedTask = await TaskModel.findByIdAndDelete(req.params.id);

        if (!deletedTask) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.status(200).json({ message: 'Task deleted successfully', task: deletedTask });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting task', error: error.message });
    }
});

// api for update any task
app.put('/api/updateTask/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { user, title, dueDate, details, completed } = req.body;

        // Find the task by ID and user
        const task = await TaskModel.findOne({ _id: id, user });

        if (!task) {
            return res.status(404).json({ message: 'Task not found for the specified user.' });
        }

        // Update task details
        task.title = title || task.title;
        task.dueDate = dueDate || task.dueDate;
        task.details = details || task.details;
        task.completed = completed !== undefined ? completed : task.completed;

        const updatedTask = await task.save();
        res.status(200).json({ message: 'Task updated successfully', task: updatedTask });
    } catch (error) {
        res.status(500).json({ message: 'Error updating task', error: error.message });
    }
});




app.listen(3000,()=>{
    console.log("Server Connected...");
})
