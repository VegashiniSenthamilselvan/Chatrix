const texts = ["Your world. Your chats.", "Fast. Secure. Reliable.", "Connect freely, anytime."];

let count = 0;
let index = 0;
let currentText = '';
let letter = '';

(function type() {
  if (count === texts.length) count = 0;
  currentText = texts[count];
  letter = currentText.slice(0, ++index);

  document.querySelector(".typing-text").textContent = letter;
  if (letter.length === currentText.length) {
    count++;
    index = 0;
    setTimeout(type, 1500);
  } else {
    setTimeout(type, 100);
  }
})();

function showForm(type) {
  document.getElementById('actions').classList.add('hidden');
  document.getElementById('formContainer').classList.remove('hidden');
  const formTitle = document.getElementById('formTitle');
  formTitle.textContent = type === 'signup' ? 'Sign Up for WhatsApp' : 'Login to WhatsApp';
}

function goBack() {
  document.getElementById('formContainer').classList.add('hidden');
  document.getElementById('actions').classList.remove('hidden');
}

document.getElementById("theme-toggle").addEventListener("click", () => {
  const body = document.body;
  if (body.classList.contains("dark-mode")) {
    body.classList.remove("dark-mode");
    body.classList.add("light-mode");
  } else {
    body.classList.remove("light-mode");
    body.classList.add("dark-mode");
  }
});

const sendOtpBtn = document.getElementById('sendOtpBtn');
const verifyOtpBtn = document.getElementById('verifyOtpBtn');
const mobileInput = document.getElementById('mobileNumber');
const otpInput = document.getElementById('otpInput');
const otpGroup = document.getElementById('otpGroup');
const message = document.getElementById('message');
const nextBtn = document.getElementById('nextBtn');

const otpModal = document.getElementById('otpModal');
const modalMessage = document.getElementById('modalMessage');
const closeModalBtn = document.getElementById('closeModalBtn');

let generatedOtp = null;
let sendingInProgress = false;

function validateMobile(number) {
  return /^\d{10}$/.test(number);
}

function showModal(text) {
  modalMessage.textContent = text;
  otpModal.style.display = 'flex';
}

function closeModal() {
  otpModal.style.display = 'none';
}

sendOtpBtn.addEventListener('click', () => {
  const mobile = mobileInput.value.trim();

  if (!validateMobile(mobile)) {
    message.textContent = 'Please enter a valid 10-digit mobile number';
    message.className = 'message error';
    return;
  }

  if (!sendingInProgress) {
    sendingInProgress = true;
    sendOtpBtn.innerHTML = 'Sending <span class="loader"></span>';
    sendOtpBtn.disabled = true;
    message.textContent = '';

    setTimeout(() => {
      generatedOtp = Math.floor(100000 + Math.random() * 900000);
      console.log('Generated OTP:', generatedOtp); // Demo only

      showModal(`OTP sent to +91 ${mobile}\nYour OTP is: ${generatedOtp}`);

      message.textContent = `OTP sent to +91 ${mobile} (Check console and popup for OTP)`;
      message.className = 'message success';

      otpGroup.style.display = 'block';
      verifyOtpBtn.style.display = 'block';

      mobileInput.disabled = true;
      sendOtpBtn.style.display = 'none';

      sendingInProgress = false;
    }, 2000);
  }
});

verifyOtpBtn.addEventListener('click', () => {
  const enteredOtp = otpInput.value.trim();

  if (enteredOtp === '') {
    message.textContent = 'Please enter the OTP';
    message.className = 'message error';
    return;
  }

  if (enteredOtp === generatedOtp.toString()) {
    message.textContent = 'OTP Verified Successfully! 🎉';
    message.className = 'message success';
    verifyOtpBtn.disabled = true;
    otpInput.disabled = true;

    // 👇 Show the "Next" button
    nextBtn.style.display = 'block';
  } else {
    message.textContent = 'Incorrect OTP. Please try again.';
    message.className = 'message error';
  }
});

nextBtn.addEventListener('click', () => {
  window.location.href = 'home.html'; // Change to your actual page
});

closeModalBtn.addEventListener('click', () => {
  closeModal();
});

otpModal.addEventListener('click', e => {
  if (e.target === otpModal) {
    closeModal();
  }
});
