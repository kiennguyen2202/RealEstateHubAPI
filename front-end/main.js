
document.addEventListener('DOMContentLoaded', function () {
	fetchUsers();
	document.getElementById('btnAddUser').addEventListener('click', addUser);
	document.getElementById('btnResetUser').addEventListener('click', clearForm);
});

const apiUrl = 'http://localhost:5134/api/users';
let currentEditingUserId = null;

// Fetch all users
function fetchUsers() {
	fetch(apiUrl)
		.then(handleResponse)
		.then(data => displayUsers(data))
		.catch(error => console.error('Fetch error:', error.message));
}

// Parse JSON if response is OK
function handleResponse(response) {
	if (!response.ok) throw new Error('Network error');
	return response.json();
}

// Render users into table
function displayUsers(users) {
	const userList = document.getElementById('userList');
	userList.innerHTML = '';
	users.forEach(user => {
		userList.innerHTML += createUserRow(user);
	});
	attachEventHandlers();
}

// Row template
function createUserRow(user) {
	return `
	<tr>
		<td>${user.id}</td>
		<td>${user.name}</td>
		<td>${user.phone}</td>
		<td>${user.email}</td>
		<td>${new Date(user.create).toLocaleString()}</td>
		<td>
			<button class="btn btn-primary btn-sm view-btn" data-id="${user.id}">Xem</button>
			<button class="btn btn-warning btn-sm edit-btn text-white" data-id="${user.id}">Sửa</button>
			<button class="btn btn-danger btn-sm delete-btn" data-id="${user.id}">Xoá</button>
		</td>
	</tr>`;
}

// Add new user
function addUser() {
	const userData = getFormData();
	if (!validateForm(userData)) return;

	if (currentEditingUserId) {
		userData.id = currentEditingUserId; 
	    updateUser(currentEditingUserId, userData);
	} else {
		fetch(apiUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(userData),
		})
			.then(handleResponse)
			.then(() => {
				clearForm();
				fetchUsers();
				notyf.success('Thêm thành công!');
			})
			.catch(error => {
				console.error('Add error:', error);
				notyf.error('Có lỗi xảy ra khi thêm người dùng.');
			});
	}
}

// Update user
function updateUser(id, data) {
	fetch(`${apiUrl}/${id}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	})
		.then(response => {
			if (response.status === 204) {
				notyf.success('Cập nhật thành công!');
				clearForm();
				fetchUsers();
			} else {
				notyf.error('Lỗi cập nhật!');
			}
		})
		.catch(error => {
			console.error('Update error:', error);
			notyf.error('Có lỗi xảy ra khi cập nhật.');
		});
}

// Delete user
function deleteUser(id) {
	fetch(`${apiUrl}/${id}`, {
		method: 'DELETE',
	})
		.then(response => {
			if (response.status === 204) {
				notyf.success('Đã xoá người dùng!');
				fetchUsers();
			} else {
				notyf.error('Xoá thất bại!');
			}
		})
		.catch(error => {
			console.error('Delete error:', error);
			notyf.error('Có lỗi xảy ra khi xoá người dùng.');
		});
}

// Event listeners for dynamic buttons
function attachEventHandlers() {
	document.querySelectorAll('.edit-btn').forEach(btn => {
		btn.addEventListener('click', () => {
			const id = btn.getAttribute('data-id');
			fetch(`${apiUrl}/${id}`)
				.then(handleResponse)
				.then(user => {
					setFormData(user);
					currentEditingUserId = user.id;
					document.getElementById('btnAddUser').innerText = 'Lưu thay đổi';
				});
		});
	});

	document.querySelectorAll('.delete-btn').forEach(btn => {
		btn.addEventListener('click', () => {
			const id = btn.getAttribute('data-id');
			if (confirm('Xác nhận xoá?')) { // Sử dụng confirm thay vì Swal
				deleteUser(id);
			}
		});
	});

	document.querySelectorAll('.view-btn').forEach(btn => {
		btn.addEventListener('click', () => {
			const id = btn.getAttribute('data-id');
			fetch(`${apiUrl}/${id}`)
				.then(handleResponse)
				.then(user => {
					// Hiển thị thông tin người dùng qua Notyf nếu cần
					notyf.success(`Tên: ${user.name}, SĐT: ${user.phone}, Email: ${user.email}`);
				});
		});
	});
}

// Get data from form
function getFormData() {
	return {
		name: document.getElementById('name').value.trim(),
		phone: document.getElementById('phone').value.trim(),
		email: document.getElementById('email').value.trim(),
		password: document.getElementById('password').value.trim(),
		create: currentEditingUserId 
	? document.getElementById('create').value 
	: getVietnamTimeISO()
	};
}

function getVietnamTimeISO() {
	const now = new Date();
	const offset = now.getTimezoneOffset(); // offset tính bằng phút
	const localTime = new Date(now.getTime() - offset * 60000);
	return localTime.toISOString().slice(0, 19); // Bỏ phần mili giây và 'Z'
}

// Fill form to edit
function setFormData(user) {
	document.getElementById('name').value = user.name;
	document.getElementById('phone').value = user.phone;
	document.getElementById('email').value = user.email;
	document.getElementById('password').value = user.password;
	document.getElementById('create').value = user.create;
}

// Reset form
function clearForm() {
	document.getElementById('userForm').reset();
	currentEditingUserId = null;
	document.getElementById('btnAddUser').innerText = 'Thêm người dùng';
}

// Validate
function validateForm(user) {
	let isValid = true;
	if (user.name === '') {
		document.getElementById('name-error').innerText = 'Vui lòng nhập họ tên';
		isValid = false;
	} else {
		document.getElementById('name-error').innerText = '';
	}
	if (user.phone === '') {
		document.getElementById('phone-error').innerText = 'Vui lòng nhập số điện thoại';
		isValid = false;
	} else {
		document.getElementById('phone-error').innerText = '';
	}
	if (user.email === '') {
		document.getElementById('email-error').innerText = 'Vui lòng nhập email';
		isValid = false;
	} else {
		document.getElementById('email-error').innerText = '';
	}
	if (user.password === '') {
		document.getElementById('password-error').innerText = 'Vui lòng nhập mật khẩu';
		isValid = false;
	} else {
		document.getElementById('password-error').innerText = '';
	}
	return isValid;
}
