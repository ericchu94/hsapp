$(function () {
  $('#caption').on('click', function () {
    $('input[name="hsapp"]').click();
  });
  $('input[name="hsapp"]').on('change', function () {
    $('form').submit();
  });
  $('#caption').on('drop', function (event) {
    var file = event.originalEvent.dataTransfer.files[0];
    var data = new FormData();
    data.append('hsapp', file);
    $.ajax({
      url: '/inject',
      data: data,
      dataType: 'binary',
      cache: false,
      contentType: false,
      processData: false,
      responseType: 'arraybuffer',
      type: 'POST',
    }).then(function (ret) {
      saveAs(new File([ret], 'FBI_inject_with_banner.app'));
    }, function (err) {
      console.log(err);
      alert('Sorry, an error has occurred.');
    });
  });
  $('#caption').on('dragenter', function (event) {
    $('#caption').addClass('highlight');
  });
  $('#caption').on('dragleave', function (event) {
    $('#caption').removeClass('highlight');
  });
});
