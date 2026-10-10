# Complete Execution Rule

Always execute tasks to the very end. Do not leave the final execution steps (like publishing, deploying, or pushing to repositories) for the user to do manually. 

Execute whatever commands are necessary to complete the task end-to-end yourself. If an action requires user authentication or a browser step (such as authenticating with GitHub or deploying a project), you should trigger the auth flow, launch the process, or open the browser for them instead of just printing the command instructions.
