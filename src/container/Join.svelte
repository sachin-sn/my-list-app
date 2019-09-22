<script>
  let sessionId, Name;

  function joinSession() {}
</script>

<section class="input-form">
  <h3>Join a session</h3>
  <section class="input-block">
    <label>Session Id:</label>
    <input type="text" class="input-text" bind:value={sessionId} />
  </section>
  <section class="input-block">
    <label>Name:</label>
    <input type="text" class="input-text" bind:value={Name} />
  </section>
  <button
    class="success"
    on:click={() => {
      joinSession();
    }}>
    Join
  </button>
  <button
    class="default"
    on:click={() => {
      sessionId = '';
      Name = '';
    }}>
    Reset
  </button>
</section>
