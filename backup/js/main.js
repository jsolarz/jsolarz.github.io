(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.materialDesignHamburger = factory();
  }
}(this, function() {
function materialDesignHamburger() {
  'use strict';

  document.querySelector('.material-design-hamburger__icon').addEventListener(
      'click',
      function() {
    var child = this.childNodes[1].classList;
    this.parentNode.nextElementSibling.classList.toggle('menu--on');

    if (child.contains('material-design-hamburger__icon--to-arrow')) {
      child.remove('material-design-hamburger__icon--to-arrow');
      child.add('material-design-hamburger__icon--from-arrow');
    } else {
      child.remove('material-design-hamburger__icon--from-arrow');
      child.add('material-design-hamburger__icon--to-arrow');
    }

  });
}

return materialDesignHamburger;
}));


CKEDITOR.replace( 'breif' );
CKEDITOR.replace( 'about' );
CKEDITOR.replace( 'role' );
CKEDITOR.replace( 'content' );
