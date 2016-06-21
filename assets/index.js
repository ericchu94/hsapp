$(function () {
  $('#caption').on('click', function () {
    $('input[name="hsapp"]').click();
  });
  $('#caption').on('drop', function (event) {
    console.log(event.dataTransfer);
  });
  $('#caption').on('dragenter', function (event) {
    $('#caption').addClass('highlight');
  });
  $('#caption').on('dragleave', function (event) {
    $('#caption').removeClass('highlight');
  });
});
