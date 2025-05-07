;; emacs-epc-server.el - EPC server for web interaction with Emacs

(require 'epc)
(require 'projectile)
(require 'json)

;; Start EPC server
(defvar my-epc-server
  (epc:start-server
   (lambda (mngr)
     ;; Define methods for buffer operations
     (epc:define-method mngr 'open-buffer
       (lambda (buffer-name)
         (switch-to-buffer (get-buffer-create buffer-name))
         buffer-name)
       "Open or create a buffer with the given name")
     
     ;; Edit buffer content
     (epc:define-method mngr 'edit-buffer
       (lambda (buffer-name content)
         (with-current-buffer (get-buffer-create buffer-name)
           (erase-buffer)
           (insert content)
           t))
       "Replace buffer content")
     
     ;; Get buffer content
     (epc:define-method mngr 'get-buffer-content
       (lambda (buffer-name)
         (with-current-buffer (get-buffer-create buffer-name)
           (buffer-string)))
       "Get the content of a buffer")
     
     ;; List all buffers
     (epc:define-method mngr 'list-buffers
       (lambda ()
         (let ((buffer-list '()))
           (dolist (buffer (buffer-list))
             (let* ((name (buffer-name buffer))
                    (mode (with-current-buffer buffer
                            major-mode))
                    (file (or (buffer-file-name buffer) "")))
               (push (list name (symbol-name mode) file) buffer-list)))
           buffer-list))
       "List all available buffers with names and major modes")
     
     ;; Search files in projectile project
     (epc:define-method mngr 'search-project-files
       (lambda (pattern)
         (projectile-find-file-dwim pattern))
       "Search for files in the current projectile project")
     
     ;; Get project root
     (epc:define-method mngr 'get-project-root
       (lambda ()
         (projectile-project-root))
       "Get the current projectile project root")
       
     ;; Find files in project matching pattern
     (epc:define-method mngr 'find-project-files
       (lambda (pattern)
         (let ((files (projectile-current-project-files)))
           (seq-filter (lambda (file)
                        (string-match-p pattern file))
                      files)))
       "Find files in project matching pattern")
     
     ;; Open a file
     (epc:define-method mngr 'open-file
       (lambda (file-path)
         (find-file file-path)
         (buffer-name))
       "Open a file in a buffer")
     
     ;; Evaluate elisp code
     (epc:define-method mngr 'eval-elisp
       (lambda (code)
         (condition-case err
             (let ((result (eval (read code))))
               (format "%S" result))
           (error (format "Error: %S" err))))
       "Evaluate Elisp code and return the result")
   )))

;; Save port to a file for the Node.js client
(with-temp-file "/tmp/emacs-epc-port.txt"
  (insert (format "%d" (process-contact my-epc-server :service))))

;; Function to stop the EPC server
(defun stop-epc-server ()
  (when my-epc-server
    (epc:stop-epc my-epc-server)))

;; Register the stop function to run when Emacs exits
(add-hook 'kill-emacs-hook 'stop-epc-server)

(message "EPC server started on port %d" (process-contact my-epc-server :service))