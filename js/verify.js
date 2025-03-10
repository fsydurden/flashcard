// verify.js - Email verification handling

document.addEventListener('DOMContentLoaded', function() {
    const verificationForm = document.getElementById('verification-form');
    const resendBtn = document.getElementById('resend-code');
    const errorElement = document.getElementById('verification-error');
    const codeInputs = document.querySelectorAll('.code-input');
    
    // Check if we have an email to verify
    const email = sessionStorage.getItem('verifyEmail');
    if (!email) {
      window.location.href = 'login.html';
      return;
    }
    
    // Set up code input behavior
    codeInputs.forEach((input, index) => {
      // Auto-focus next input on entry
      input.addEventListener('input', function() {
        if (this.value.length === this.maxLength) {
          const nextInput = codeInputs[index + 1];
          if (nextInput) {
            nextInput.focus();
          }
        }
      });
      
      // Handle backspace to go back to previous input
      input.addEventListener('keydown', function(e) {
        if (e.key === 'Backspace' && this.value.length === 0) {
          const prevInput = codeInputs[index - 1];
          if (prevInput) {
            prevInput.focus();
          }
        }
      });
    });
    
    // Handle verification submission
    verificationForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Gather verification code
      let code = '';
      codeInputs.forEach(input => {
        code += input.value;
      });
      
      if (code.length !== 6) {
        errorElement.textContent = 'Please enter the complete 6-digit code';
        errorElement.style.display = 'block';
        return;
      }
      
      // Call verification function
      Auth.verifyEmail(email, code)
        .then(() => {
          sessionStorage.removeItem('verifyEmail');
          
          // Show success message and redirect after delay
          const message = document.getElementById('verification-message');
          message.innerHTML = '<p>Your email has been successfully verified!</p><p>Redirecting to login page...</p>';
          
          setTimeout(() => {
            window.location.href = 'login.html';
          }, 2000);
        })
        .catch(error => {
          errorElement.textContent = error;
          errorElement.style.display = 'block';
        });
    });
    
    // Handle resend code
    resendBtn.addEventListener('click', function(e) {
      e.preventDefault();
      
      // In a real app, this would call an API to resend the code
      // For our demo, we'll just show a message
      
      // Get users
      const users = JSON.parse(localStorage.getItem('simpleAnki_users'));
      const user = users.find(user => user.email === email);
      
      if (user) {
        const newCode = Math.floor(100000 + Math.random() * 900000).toString();
        const userIndex = users.findIndex(u => u.id === user.id);
        users[userIndex].verificationCode = newCode;
        
        localStorage.setItem('simpleAnki_users', JSON.stringify(users));
        console.log(`New verification code for ${email}: ${newCode}`);
        
        // Show success message
        const message = document.createElement('div');
        message.textContent = 'A new verification code has been sent to your email';
        message.style.color = 'green';
        message.style.marginTop = '10px';
        
        this.parentNode.appendChild(message);
        
        setTimeout(() => {
          message.remove();
        }, 3000);
      }
    });
  });