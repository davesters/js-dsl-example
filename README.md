## Javascript DSL Example

An example of an external DSL (Domain specific language) written in Javascript. This is a pretty small DSL, which let's me write the lexer and the parser by hand. If the language was any larger, writing it manually could start to get out of hand.

This DSL allows a user to write test cases around a JSON API. It will call an endpoint and run assertions over types and data. This does not support any type of authentication at the moment, so probably fairly limited in it's use.

### Running the example

First, clone the repo to your machine. Then install NPM packages.

    npm install

Then you can run the sample code.

    node run.js

## The Language

The language is extemely simple, but has a strict structure to keep the parser simple. Here is some sample code.

    test "https://api.github.com/users/davesters" {
        should be object
        size should equal 30

        fields {
            "login" should be string
            id should equal 439674
            name should equal "David Corona"
            site_admin should not equal true
        }
    }

Most whitespace does not matter one bit, as long as there are spaces between words. You could actually put this entire thing on one line and it would still work (minifiable FTW!).

Note: Strings must be enclosed with double quotes (").

### Test block

Everything is run inside of a `test` block. It takes a string argument, which is the URL of the API endpoint to call. Test blocks contain any number of `should` statements, `fields` blocks, or `each` blocks. A program may contain more than one `test` block, but they cannot be nested.

### Scopes

A quick side note about scopes. This DSL has a concept of scopes, or maybe you can call them contexts. A scope would be the current block that assertions are being run in.

For example. In the main body of a `test` block, the current scope is the root of the JSON object or array that is returned by the API call. `fields` or `each` blocks can change the scope to another node that is inside the current scope. We will see these blocks shortly. 

### Should statement

A should statement is an assertion upon a JSON object, array or field. It has the format of:

    [field name] should [not] (be [type] | equal [value])

* `[field name]` is optional. If it exists, it denotes which field in the current scope is being tested. If it does not exist, it applies to the object or array of the current scope.
* `not` is an optional operator which tests for anything not true.
* `be [type]` is a test that a field is a specific data type. (i.e. number, string, boolean, object, array, true or false)
* `equal [value]` is a test that a field's value matches the specified value.

Some sample `should` statements:

    should be object    // Tests if the current item in scope is an object
    size should equal 30    // Tests if the size of current item in scope is 30
    "login" should be string    // Tests if the login field is a string type
    id should equal 439674  // Tests if the id field equals the number 439674
    name should equal "David Corona"    // Tests the name field equals "David Corona"
    site_admin should not equal true    // Tests the site_admin field is not true

### Fields block

A fields block lets us step into an object in our current scope, and make that object our new scope. Any `should` statements inside of a `fields` block will apply to this new scope. Field blocks can also contain other nested `field` or `each` blocks. It has the format of:

    fields [field name] { }

Note that the field name of a field block is optional. If it is not specified, the `should` statements inside the `field` block will apply to fields in the object that is currently in scope. Note that it must be an object that is in scope. Using a `field` block without a field name is not that useful when you are inside of an object. You could just put the `should` statements inside the current block.

### Each block

An each block lets us loop over objects inside an array and run a set of tests against those objects. Each iteration of the loop will run within the scope of the current object in the array. Each blocks can contain other nested `field` or `each` blocks. It has a format of:

    each [field name] { }

Note that the field name of an each block is optional. If it is not specified, it will loop over the objects in the array currently in scope. Note that it must be an array that is in scope.

### Size keyword

There is a special `size` keyword that can be used instead of the field name in a `should` statement. This let's you assert over the size of the current item in scope. If the scope is an object, the number of fields. If the scope is an array, the number of items in the array.

Example:

    size should equal 30

## The Grammar

This has a pretty simple grammar with a small amount of productions.

    Z => S
    S => test t { T }
    T => fields F { T }
    T => each F { T }
    T => A should BCE
    T => e
    A => size | i | t | e
    B => not | e
    C => be | equal
    E => object | array | string | number | boolean | true | false | t
    F => i | t | e

### Keywords

These are the keywords, or reserved words, in this DSL. If you want to use these words as field names, you should put quotes around them as if they were strings.

    test
    fields
    size
    each
    object
    array
    string
    number
    boolean
    true
    false
    should
    not
    be
    equal