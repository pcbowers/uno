$("#form-main-page").submit(e => {
  e.preventDefault();
  window.location.href = $("#game").val();
  return false;
});
