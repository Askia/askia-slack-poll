To create a simple poll you can specify question and responses like this:

```
/askia Drink? Wine Beer Pastis Water
```

If the question or the responses contains space they must be wrapped between
quotes `\"` characters like this:

```
/askia "What ya wanna drink?" "IPA Beer" "Stout Beer" Other 
```

If a response is too long to be displayed as button or if you simply don't
want to repeat the whole text of your response in a button. You can select
the part of your text that will be displayed as button by using `@label{}.`
in the response text.

```
/askia "What ya wanna drink?" "Double @label{IPA}" "Milk @label{Imperial Stout}"
```

# --limit

```
/askia "What ya wanna drink?" Wine Beer Scotch Pastis Water --limit 1
```

Sets a limit of responses that a user can votes for. When set to `0` no limit
is applied. Default value is set to `0`.

# --expires

```
/askia "What ya wanna drink on Friday?" Wine Beer Water --expires "1d 2h"
```

Sets the times before users votes will expires. The times can be expressed 
like this:

* for 1 day `1d`
* for 2 hours `2h`
* for 10 min `10min`
* for 30 seconds `30s`

# --anonymous

```
/askia Drink? Wine Beer Water --anonymous
```

The name of users will not be displayed while they vote

# --no-anonymous-label

```
/askia Drink? Beer Water --anonymous --no-anonymous-label
```

When the `anonymous` flag is set, hides the `anonymous poll` quote at the
end of the poll message
